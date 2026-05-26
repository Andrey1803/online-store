<?php
/**
 * Отправка заявки с корзины на почту магазина.
 * Работает на хостинге domen.by с PHP. Не удаляйте при деплое.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: ' . requestOrigin());
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

header('Access-Control-Allow-Origin: ' . requestOrigin());

const SHOP_EMAIL = 'info@akvasnab.by';
const FROM_EMAIL = 'info@akvasnab.by';
const SITE_NAME = 'АкваСнаб';
const RATE_LIMIT_DIR = __DIR__ . '/.ratelimit';

function requestOrigin(): string
{
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (str_contains($host, 'akvasnab.by')) {
        return 'https://' . preg_replace('/:\d+$/', '', $host);
    }
    return '*';
}

function clientIp(): string
{
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function rateLimitOk(): bool
{
    if (!is_dir(RATE_LIMIT_DIR)) {
        @mkdir(RATE_LIMIT_DIR, 0700, true);
    }
    $file = RATE_LIMIT_DIR . '/' . md5(clientIp());
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $hits = array_filter(
            explode(',', (string) file_get_contents($file)),
            static fn($t) => $now - (int) $t < 3600
        );
    }
    if (count($hits) >= 10) {
        return false;
    }
    $hits[] = (string) $now;
    file_put_contents($file, implode(',', $hits));
    return true;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

if (!empty($data['website'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Spam rejected']);
    exit;
}

if (!rateLimitOk()) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Too many requests']);
    exit;
}

$id = trim((string) ($data['id'] ?? ''));
$name = trim((string) ($data['customerName'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$comment = trim((string) ($data['comment'] ?? ''));
$delivery = trim((string) ($data['deliveryMethod'] ?? ''));
$total = (float) ($data['total'] ?? 0);
$items = $data['items'] ?? [];
$customerEmail = trim((string) ($data['customerEmail'] ?? ''));

if ($id === '' || $name === '' || $phone === '' || !is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) < 9) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid phone']);
    exit;
}

$deliveryLabel = match ($delivery) {
    'pickup' => 'Самовывоз',
    'delivery' => 'Доставка',
    default => 'Не указано',
};

$lines = [];
$lines[] = 'Заявка с сайта ' . SITE_NAME;
$lines[] = 'Номер: ' . $id;
$lines[] = 'Дата: ' . date('d.m.Y H:i');
$lines[] = '';
$lines[] = 'Клиент: ' . $name;
$lines[] = 'Телефон: ' . $phone;
if ($customerEmail !== '') {
    $lines[] = 'E-mail: ' . $customerEmail;
}
$lines[] = 'Получение: ' . $deliveryLabel;
if ($comment !== '') {
    $lines[] = 'Комментарий: ' . $comment;
}
$lines[] = '';
$lines[] = 'Товары:';
foreach ($items as $item) {
    if (!is_array($item)) {
        continue;
    }
    $qty = (int) ($item['quantity'] ?? 1);
    $price = (float) ($item['price'] ?? 0);
    $pname = trim((string) ($item['name'] ?? 'Товар'));
    $article = trim((string) ($item['article'] ?? ''));
    $slug = trim((string) ($item['slug'] ?? ''));
    $line = '— ' . $pname;
    if ($article !== '') {
        $line .= ' (арт. ' . $article . ')';
    }
    $line .= ' × ' . $qty . ' = ' . number_format($price * $qty, 2, '.', ' ') . ' BYN';
    if ($slug !== '') {
        $line .= "\n   https://akvasnab.by/product/" . $slug;
    }
    $lines[] = $line;
}
$lines[] = '';
$lines[] = 'Итого: ' . number_format($total, 2, '.', ' ') . ' BYN (ориентировочно)';

$body = implode("\n", $lines);
$subject = SITE_NAME . ' — заявка ' . $id;

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . SITE_NAME . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . ($customerEmail !== '' ? $customerEmail : FROM_EMAIL),
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail(SHOP_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
    exit;
}

echo json_encode(['ok' => true, 'id' => $id]);

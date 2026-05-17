/** Связь подкатегорий из прайса AkvaBreg с родительскими разделами */

/** Уровень 3: тип товара → имя родительской подкатегории (уровень 2) */
export const NESTED_SUBCATEGORY_PARENT: Record<string, string> = {
  'Тройники комбинированные с НР': 'Комбинированные фитинги',
  'Муфты комбинированные с НР': 'Комбинированные фитинги',
  'Муфты соединительные': 'Комбинированные фитинги',
  'Муфты разъемные с НР': 'Комбинированные фитинги',
  'Муфта комбинированная': 'Комбинированные фитинги',
  'Муфта комбинированная для шлангов рукавов': 'Комбинированные фитинги',
};

export const SUBCATEGORY_PARENT: Record<string, string> = {

  // Насосы

  'Скважинные насосы': 'nasosy',

  'Насосные станции': 'nasosy',

  'Фекальные насосы': 'nasosy',

  'Дренажные насосы': 'nasosy',

  'Поверхностные насосы': 'nasosy',

  'Циркуляционные насосы': 'nasosy',

  'Колодезные насосы': 'nasosy',

  'Шламовые насосы': 'nasosy',

  'Насосы для бассейна': 'nasosy',

  'Повысительные насосы': 'nasosy',

  'Насосы Ручеек': 'nasosy',

  'Канализационные установки': 'nasosy',

  'Насосы для фонтана': 'nasosy',

  'Воздушные насосы': 'nasosy',

  // Автоматика

  'Механические блоки управления': 'avtomatika',

  'Электронные блоки управления': 'avtomatika',

  'Частотные блоки управления': 'avtomatika',

  'Готовые системы автоматики': 'avtomatika',

  // Баки

  'Гидроаккумуляторы для воды': 'baki',

  'Расширительные баки для отопления': 'baki',

  'Расширительные баки для отоплен': 'baki',

  'Расширительные баки для ГВС': 'baki',

  'Кронштейн и крепления для баков': 'baki',

  'Мембраны для баков': 'baki',

  'Фланцы для баков': 'baki',

  // Фильтры

  'Картриджи для фильтров': 'filtry',

  'Колбы для фильтра': 'filtry',

  'Фильтры латунные (Грязевики)': 'filtry',

  'Питьевые системы': 'filtry',

  'Системы обратного осмоса': 'filtry',

  // Трубы

  'Труба питьевая': 'truby',

  'Труба канализационная': 'truby',

  'Автоматические трубные муфты': 'truby',

  'Люк канализационные': 'truby',

  // Комплектующие (латунь, краны, скважина)

  'Адаптеры для скважин': 'komplektuyushchie',

  'Баки для душа': 'komplektuyushchie',

  'Гибкие подводки': 'komplektuyushchie',

  'Группа безопасности': 'komplektuyushchie',

  'Кабеля': 'komplektuyushchie',

  'Компрессионные муфты': 'komplektuyushchie',

  'Краны': 'komplektuyushchie',

  'Манометры': 'komplektuyushchie',

  'Обратные клапана': 'komplektuyushchie',

  'Обсадные трубы для скважины': 'komplektuyushchie',

  'Оголовки скважинные': 'komplektuyushchie',

  'Сливные клапана': 'komplektuyushchie',

  'Трос и зажимы': 'komplektuyushchie',

  'Фитинги латунные': 'komplektuyushchie',

  'Уплотнительные материалы': 'komplektuyushchie',

  'Хомуты трубные (КТР)': 'komplektuyushchie',

  // Шланги

  'Поливочные': 'shlangi',

  'Шланги для фекальных, дренажных насосов': 'shlangi',

  'Шланги для фекальных насосов': 'shlangi',

  'Всасывающие': 'shlangi',

  'Фитинги для шлангов': 'shlangi',

  // Полипропилен

  'Полипропиленовые трубы': 'polipropilen',

  'Полипропиленовые фитинги': 'polipropilen',

  'Комбинированные фитинги': 'polipropilen',

  'Краны, скобы, клапана.': 'polipropilen',

  'Краны, скобы, клапана': 'polipropilen',

  // Водонагреватели

  'Газовые водонагреватели': 'vodonagrevateli',

  'Краны — водонагреватели': 'vodonagrevateli',

  'Электрические водонагреватели': 'vodonagrevateli',

  // Отопление

  'Конвекторные батареи': 'otoplenie',

  'Конвекторчые батареи': 'otoplenie',

  'Инфракрасные панели': 'otoplenie',

  'Инфракрасные обогреватели': 'otoplenie',

  'Масляные радиаторы': 'otoplenie',

  'Тепловентиляторы': 'otoplenie',

  'Тепловые пушки': 'otoplenie',

  'Электрические котлы': 'otoplenie',

  // Тёплый пол

  'Демпферная лента': 'teplyy-pol',

  'Крепления для монтажа': 'teplyy-pol',

  'Трубке защитная гофрированная': 'teplyy-pol',

  'Труба защитная гофрированная': 'teplyy-pol',

  'Фольга для теплого поля': 'teplyy-pol',

  'Шкафы коллекторные': 'teplyy-pol',

  // Запчасти

  'Двигатели для насосов': 'zapchasti',

  'Гидравлические части': 'zapchasti',

  'Диффузоры для насоса': 'zapchasti',

  'Измельчители': 'zapchasti',

  'Комплекты гаек': 'zapchasti',

  'Консоли для насоса': 'zapchasti',

  'Корпуса для несосов': 'zapchasti',

  'Крыльчатки для насосов': 'zapchasti',

  'Направляющие для насосов': 'zapchasti',

  'Рабочие винты для насосов': 'zapchasti',

  'Ремкомплект': 'zapchasti',

  'Сальники для насосов': 'zapchasti',

  'Статора и роторы': 'zapchasti',

  'Фитинги и штуцера для насосов': 'zapchasti',

};



/** Лист mega → родитель (если совпадает с корневым разделом) */

export const SHEET_TO_PARENT: Record<string, string> = {

  'Бытовые насосы': 'nasosy',

  'Автоматика для насосов': 'avtomatika',

  'Мембранные баки': 'baki',

  'Фильтра и картриджи для воды': 'filtry',

  'Комплектующие': 'komplektuyushchie',

  'Шланги': 'shlangi',

  'Водонагреватели': 'vodonagrevateli',

  'Отопительное оборудование': 'otoplenie',

  'Полипропилен': 'polipropilen',

  'Теплый пол': 'teplyy-pol',

  'Запасные части': 'zapchasti',

  'Трубы водоснабжения': 'truby',

};



/** Эвристика для категорий без точного совпадения в SUBCATEGORY_PARENT */

function resolveParentIdHeuristic(categoryName: string): string | undefined {

  const n = categoryName.toLowerCase().trim();

  if (!n) return undefined;



  if (n === 'краны') return 'komplektuyushchie';

  if (n.includes('фитинг') && n.includes('латун')) return 'komplektuyushchie';

  if (n.includes('компрессион') && n.includes('муфт')) return 'komplektuyushchie';

  if (n.includes('обратн') && n.includes('клапан')) return 'komplektuyushchie';

  if (n.includes('оголовок') && n.includes('скважин')) return 'komplektuyushchie';

  if (n.includes('обсадн') && n.includes('труб')) return 'komplektuyushchie';

  if (n.includes('адаптер') && n.includes('скважин')) return 'komplektuyushchie';

  if (n.includes('трос') || (n.includes('зажим') && !n.includes('шланг'))) return 'komplektuyushchie';

  if (n.includes('манометр')) return 'komplektuyushchie';

  if (n.includes('уплотнит')) return 'komplektuyushchie';

  if (n.includes('хомут') && n.includes('труб')) return 'komplektuyushchie';



  if (n.includes('кран') && (n.includes('водонагрев') || n.includes('водонагревател'))) {

    return 'vodonagrevateli';

  }

  if (n.includes('кран') && (n.includes('скоб') || n.includes('клапан'))) {

    return 'polipropilen';

  }



  if (n.includes('картридж') || n.includes('осмос') || n.includes('грязевик')) return 'filtry';

  if (n.includes('гидроаккумулятор') || n.includes('расширительн') && n.includes('бак')) {

    return 'baki';

  }

  if (n.includes('шланг')) return 'shlangi';

  if (n.includes('полипропилен') || (n.includes('ппр') && !n.includes('латун'))) {

    return 'polipropilen';

  }

  if (n.includes('скважинн') && n.includes('насос')) return 'nasosy';

  if (n.includes('тепл') && n.includes('пол')) return 'teplyy-pol';

  if (n.includes('водонагревател')) return 'vodonagrevateli';



  return undefined;

}



export function resolveParentId(categoryName: string, sheetName?: string): string | undefined {

  const trimmed = categoryName.trim();

  if (NESTED_SUBCATEGORY_PARENT[trimmed]) {
    const parentName = NESTED_SUBCATEGORY_PARENT[trimmed];
    if (SUBCATEGORY_PARENT[parentName]) return SUBCATEGORY_PARENT[parentName];
  }

  if (SUBCATEGORY_PARENT[trimmed]) return SUBCATEGORY_PARENT[trimmed];

  if (sheetName && SHEET_TO_PARENT[sheetName.trim()]) return SHEET_TO_PARENT[sheetName.trim()];

  return resolveParentIdHeuristic(trimmed);

}


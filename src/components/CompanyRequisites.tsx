import { COMPANY } from '../data/company';

type Props = {
  showBank?: boolean;
  compact?: boolean;
};

export function CompanyRequisites({ showBank = true, compact = false }: Props) {
  if (compact) {
    return (
      <p className="company-requisites company-requisites--compact">
        {COMPANY.shortName}, УНП {COMPANY.unp}
        <br />
        {COMPANY.legalAddress}
      </p>
    );
  }

  return (
    <dl className="company-requisites">
      <div>
        <dt>Продавец</dt>
        <dd>{COMPANY.legalName}</dd>
      </div>
      <div>
        <dt>УНП</dt>
        <dd>{COMPANY.unp}</dd>
      </div>
      {COMPANY.vatPayer && (
        <div>
          <dt>НДС</dt>
          <dd>
            плательщик НДС, ставка {COMPANY.vatRate}%. Цены на сайте для покупателей указаны с учётом
            НДС
          </dd>
        </div>
      )}
      <div>
        <dt>Руководитель</dt>
        <dd>
          {COMPANY.directorRole} {COMPANY.director}, действует на основании {COMPANY.directorBasis}
        </dd>
      </div>
      {showBank && (
        <>
          <div>
            <dt>Расчётный счёт</dt>
            <dd>
              {COMPANY.bankAccount} ({COMPANY.bankCurrency})
            </dd>
          </div>
          <div>
            <dt>Банк</dt>
            <dd>
              {COMPANY.bankName}, BIC {COMPANY.bic}
            </dd>
          </div>
        </>
      )}
      <div>
        <dt>Юридический адрес</dt>
        <dd>{COMPANY.legalAddress}</dd>
      </div>
      <div>
        <dt>Почтовый адрес</dt>
        <dd>{COMPANY.postalAddress}</dd>
      </div>
      <div>
        <dt>E-mail</dt>
        <dd>
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </dd>
      </div>
      <div>
        <dt>Телефон</dt>
        <dd>
          <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>
        </dd>
      </div>
    </dl>
  );
}

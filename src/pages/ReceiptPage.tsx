import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Empty, PageHeader, Skeleton } from '../components/ui';
import { SHOP } from '../config';
import { useApi } from '../hooks/useStore';
import { api } from '../lib/api';
import { METHOD_LABEL, cls, formatLaoDateTime, formatPhone, money, vehicleText } from '../utils/format';

const PAPER_KEY = 'vcl-carcare-paper';

export function ReceiptPage() {
  const { id = '' } = useParams();
  const { data: bill, loading } = useApi(() => api.jobs.receipt(id), [id]);
  const [paper, setPaper] = useState<'58' | '80'>(() => (localStorage.getItem(PAPER_KEY) === '58' ? '58' : '80'));

  function pickPaper(next: '58' | '80') {
    setPaper(next);
    localStorage.setItem(PAPER_KEY, next);
  }

  const title = bill?.title || (bill?.vehicle ? 'ໃບບິນ' : 'ໃບບິນຂາຍສິນຄ້າ');

  return (
    <div className="page">
      <div className="no-print">
        <PageHeader title={title} back="/" />
      </div>
      {loading && !bill && <Skeleton rows={6} />}
      {!loading && !bill && <Empty text="ບໍ່ພົບບິນນີ້" />}
      {bill && (
        <>
          <style>{`@media print { @page { size: ${paper}mm auto; margin: 2mm; } }`}</style>
          <article className={cls('paper', `w${paper}`)}>
            <div className="center">
              <h2>{bill.shop?.name || SHOP.name}</h2>
              {bill.shop?.branch && <div>{bill.shop.branch}</div>}
              {bill.shop?.address && <div>{bill.shop.address}</div>}
              <div>ໂທ {formatPhone(bill.shop?.phone || SHOP.phoneRaw)}</div>
              <div className="receipt-title">{title}</div>
            </div>
            <hr className="dash" />
            <div className="line"><span>ເລກທີ</span><b>{bill.receiptNo || bill.jobCode || '-'}</b></div>
            {bill.receiptNo && bill.jobCode && <div className="line"><span>ບິນ</span><b>{bill.jobCode}</b></div>}
            <div className="line"><span>ວັນທີ</span><b>{formatLaoDateTime(bill.paidAt || bill.receivedAt || new Date())}</b></div>
            {bill.customer?.name && <div className="line"><span>ລູກຄ້າ</span><b>{bill.customer.name}</b></div>}
            {bill.customer?.phone && <div className="line"><span>ເບີໂທ</span><b>{formatPhone(bill.customer.phone)}</b></div>}
            {bill.vehicle && (
              <>
                <div className="line"><span>ທະບຽນ</span><b>{[bill.vehicle.plateNo, bill.vehicle.province].filter(Boolean).join(' · ')}</b></div>
                {vehicleText(bill.vehicle) && <div className="line"><span>ລົດ</span><b>{vehicleText(bill.vehicle)}</b></div>}
              </>
            )}
            {bill.staff && <div className="line"><span>ພະນັກງານ</span><b>{bill.staff}</b></div>}
            <hr className="dash" />
            {(bill.items ?? []).map((item, index) => {
              const product = item.kind === 'PRODUCT' || (item.qty ?? 1) > 1 || Boolean(item.unit);
              return (
                <div key={`${item.name}-${index}`} className="line">
                  <span>
                    {item.name}
                    {product && <small className="line-sub"> {item.qty ?? 1}{item.unit ? ` ${item.unit}` : ''} × {money(item.unitPrice ?? item.price)}</small>}
                  </span>
                  <b>{money(item.price)}</b>
                </div>
              );
            })}
            <hr className="dash" />
            <div className="line"><span>ລວມ</span><b>{money(bill.subtotal ?? 0)}</b></div>
            {(bill.discount ?? 0) > 0 && <div className="line"><span>ສ່ວນຫຼຸດ</span><b>−{money(bill.discount ?? 0)}</b></div>}
            <div className="line big"><span>ຍອດຊຳລະ</span><b>{money(bill.total ?? 0)} ກີບ</b></div>
            <div className="line"><span>ວິທີຊຳລະ</span><b>{bill.method ? METHOD_LABEL[bill.method] : 'ຍັງບໍ່ທັນຊຳລະ'}</b></div>
            {bill.method === 'CASH' && bill.received != null && <div className="line"><span>ຮັບເງິນ</span><b>{money(bill.received)}</b></div>}
            {bill.method === 'CASH' && bill.change != null && <div className="line"><span>ເງິນທອນ</span><b>{money(bill.change)}</b></div>}
            {bill.refNo && <div className="line"><span>ເລກອ້າງອີງ</span><b>{bill.refNo}</b></div>}
            <hr className="dash" />
            <p className="center">{SHOP.slogan}</p>
            <p className="center">ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
          </article>
          <div className="pad no-print stack">
            <div className="segment">
              <button type="button" className={cls(paper === '58' && 'on')} onClick={() => pickPaper('58')}>58 mm</button>
              <button type="button" className={cls(paper === '80' && 'on')} onClick={() => pickPaper('80')}>80 mm</button>
            </div>
            <div className="pair flush">
              <button type="button" className="btn red" onClick={() => window.print()}>
                <Icon name="print" size={18} /> ພິມ
              </button>
              <Link className="btn ghost" to="/">ກັບໜ້າຫຼັກ</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

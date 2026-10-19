import { SHOP } from '../config';

export function PayQr() {
  return (
    <div className="pay-qr">
      <img src={SHOP.qr} alt="LAO QR pay" />
      <b>ສະແກນເພື່ອຊຳລະ</b>
      <small>LAPNet · LAO QR pay</small>
    </div>
  );
}

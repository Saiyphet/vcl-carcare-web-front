import { useState } from 'react';
import { notify } from '../api';
import { installApp, useInstall } from '../hooks/useInstall';
import { Icon } from './Icon';
import { Sheet } from './ui';

/** "ດາວໂຫຼດແອັບ": installs the web app so it gets its own icon on the desktop / home screen */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const state = useInstall();
  const [help, setHelp] = useState(false);
  if (state === 'installed') return compact ? null : <p className="paid-banner flush">ຕິດຕັ້ງແອັບໃນເຄື່ອງນີ້ແລ້ວ</p>;

  async function click() {
    if (state === 'ready') {
      const ok = await installApp();
      if (ok) notify('ຕິດຕັ້ງແອັບແລ້ວ — ເບິ່ງໄອຄອນຢູ່ໜ້າ Desktop');
    } else setHelp(true);
  }

  return (
    <>
      {compact ? (
        <button type="button" className="icon-btn theme-btn" aria-label="ດາວໂຫຼດແອັບ" title="ດາວໂຫຼດແອັບ" onClick={() => void click()}>
          <Icon name="download" size={20} />
        </button>
      ) : (
        <button type="button" className="btn red wide" onClick={() => void click()}>
          <Icon name="download" size={18} /> ດາວໂຫຼດແອັບ (ໄອຄອນໜ້າ Desktop)
        </button>
      )}
      {help && (
        <Sheet title="ຕິດຕັ້ງແອັບ" onClose={() => setHelp(false)}>
          {state === 'ios' ? (
            <ol className="install-steps">
              <li>ເປີດໜ້ານີ້ດ້ວຍ Safari</li>
              <li>ກົດປຸ່ມ Share (ສີ່ຫຼ່ຽມມີລູກສອນຂຶ້ນ)</li>
              <li>ເລືອກ "Add to Home Screen" ແລ້ວກົດ Add</li>
            </ol>
          ) : (
            <ol className="install-steps">
              <li>ເປີດໜ້ານີ້ດ້ວຍ Google Chrome ຫຼື Microsoft Edge</li>
              <li>ກົດໄອຄອນຕິດຕັ້ງ (⊕ ຫຼື ຈໍມີລູກສອນ) ຢູ່ທ້າຍແຖບທີ່ຢູ່ ຫຼື ເມນູ ⋮ → "Install VCL CARCARE"</li>
              <li>ໄອຄອນ VCL CARCARE ຈະຂຶ້ນຢູ່ໜ້າ Desktop ແລະ Start menu</li>
            </ol>
          )}
          <button type="button" className="btn ghost wide mt" onClick={() => setHelp(false)}>ເຂົ້າໃຈແລ້ວ</button>
        </Sheet>
      )}
    </>
  );
}

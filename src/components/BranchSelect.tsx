import { setSelectedBranch } from '../api';
import { useStore } from '../hooks/useStore';

export function BranchSelect() {
  const { base, admin, branchId } = useStore();
  if (!admin) return null;
  return (
    <label className="branch-select">
      <span>ສາຂາ</span>
      <select
        aria-label="ເລືອກສາຂາ"
        value={branchId ?? 'all'}
        onChange={(event) => setSelectedBranch(event.target.value === 'all' ? null : event.target.value)}
      >
        <option value="all">ທຸກສາຂາ</option>
        {base.branches.filter((branch) => branch.active !== false).map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>
        ))}
      </select>
    </label>
  );
}

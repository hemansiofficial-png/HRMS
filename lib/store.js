const employees = [
  { id: 1, name: 'Aarav Mehta', role: 'Frontend Engineer', team: 'Product', status: 'active', location: 'Bengaluru', manager: 'Riya Singh' },
  { id: 2, name: 'Nisha Rao', role: 'HR Manager', team: 'People Ops', status: 'active', location: 'Hyderabad', manager: 'Anita Patel' },
  { id: 3, name: 'Rohan Das', role: 'QA Engineer', team: 'Product', status: 'active', location: 'Pune', manager: 'Riya Singh' },
  { id: 4, name: 'Fatima Khan', role: 'Finance Executive', team: 'Finance', status: 'active', location: 'Mumbai', manager: 'Vivek Menon' }
];

const leaveBalances = [
  { employee: 'Aarav Mehta', annual: 18, used: 4 },
  { employee: 'Nisha Rao', annual: 20, used: 6 },
  { employee: 'Rohan Das', annual: 18, used: 2 },
  { employee: 'Fatima Khan', annual: 18, used: 3 }
];

const leaves = [
  { id: 1, employee: 'Nisha Rao', type: 'Vacation', days: 2, status: 'pending', from: '2026-03-13', to: '2026-03-14', reason: 'Family event' },
  { id: 2, employee: 'Aarav Mehta', type: 'Sick Leave', days: 1, status: 'approved', from: '2026-03-10', to: '2026-03-10', reason: 'Fever' }
];

const payrollRuns = [
  { id: 1, month: 'Feb 2026', headcount: 92, gross: 8200000, net: 6240000, status: 'processed', compliance: 'filed' },
  { id: 2, month: 'Mar 2026', headcount: 95, gross: 8510000, net: 6485000, status: 'draft', compliance: 'pending' }
];

const onboarding = [
  { id: 1, name: 'Isha Verma', role: 'Backend Engineer', joiningDate: '2026-03-20', buddy: 'Aarav Mehta', status: 'documentation pending', checklist: 60 },
  { id: 2, name: 'Karan Nair', role: 'Sales Executive', joiningDate: '2026-03-25', buddy: 'Fatima Khan', status: 'it setup pending', checklist: 45 }
];

const assets = [
  { id: 1, item: 'MacBook Pro 14', employee: 'Aarav Mehta', type: 'Laptop', status: 'allocated', dueDate: '2027-03-01' },
  { id: 2, item: 'Dell Latitude 7440', employee: '', type: 'Laptop', status: 'available', dueDate: '' },
  { id: 3, item: 'iPhone 14', employee: 'Nisha Rao', type: 'Mobile', status: 'allocated', dueDate: '2027-02-11' }
];

const performance = [
  { id: 1, employee: 'Aarav Mehta', cycle: 'Q1 2026', rating: 4.5, goalProgress: 82, reviewStatus: 'manager review' },
  { id: 2, employee: 'Nisha Rao', cycle: 'Q1 2026', rating: 4.2, goalProgress: 78, reviewStatus: 'completed' },
  { id: 3, employee: 'Fatima Khan', cycle: 'Q1 2026', rating: 4.0, goalProgress: 74, reviewStatus: 'self review' }
];

const recruitment = [
  { id: 1, role: 'Senior Backend Engineer', openings: 2, stage: 'interviewing', owner: 'Riya Singh', candidates: 7 },
  { id: 2, role: 'Product Designer', openings: 1, stage: 'offer', owner: 'Nisha Rao', candidates: 3 }
];

const users = [
  { id: 1, name: 'Anita Patel', appRole: 'admin' },
  { id: 2, name: 'Nisha Rao', appRole: 'hr' },
  { id: 3, name: 'Riya Singh', appRole: 'manager' },
  { id: 4, name: 'Aarav Mehta', appRole: 'employee' }
];

const recruitmentFlow = ['screening', 'interviewing', 'offer', 'hired'];
let nextLeaveId = 3;

function isPrivileged(role) {
  return role === 'admin' || role === 'hr';
}

export function getUsers() {
  return users;
}

export function getEmployees() {
  return employees;
}

export function getAttendanceSummary() {
  const present = employees.filter((employee) => employee.status === 'active').length;
  const absent = employees.filter((employee) => employee.status === 'inactive').length;
  return { present, wfh: 9, absent, total: employees.length };
}

export function getLeaves() {
  return leaves;
}

export function getLeaveBalances() {
  return leaveBalances.map((entry) => ({ ...entry, remaining: entry.annual - entry.used }));
}

export function createLeaveRequest(payload) {
  const record = {
    id: nextLeaveId++,
    employee: payload.employee,
    type: payload.type,
    days: payload.days,
    status: 'pending',
    from: payload.from,
    to: payload.to,
    reason: payload.reason
  };

  leaves.unshift(record);
  return record;
}

export function approveLeaveRequest(id, actorRole) {
  if (!isPrivileged(actorRole) && actorRole !== 'manager') {
    return { error: 'forbidden' };
  }

  const leave = leaves.find((item) => item.id === id);
  if (!leave) {
    return { error: 'not_found' };
  }

  leave.status = 'approved';
  const balance = leaveBalances.find((entry) => entry.employee === leave.employee);
  if (balance) {
    balance.used += leave.days;
  }

  return { data: leave };
}

export function getPayrollRuns() {
  return payrollRuns;
}

export function lockPayrollRun(id, actorRole) {
  if (actorRole !== 'admin') {
    return { error: 'forbidden' };
  }

  const run = payrollRuns.find((item) => item.id === id);
  if (!run) {
    return { error: 'not_found' };
  }

  run.status = 'processed';
  run.compliance = 'filed';
  return { data: run };
}

export function getOnboardingList() {
  return onboarding;
}

export function completeOnboarding(id, actorRole) {
  if (!isPrivileged(actorRole)) {
    return { error: 'forbidden' };
  }

  const item = onboarding.find((record) => record.id === id);
  if (!item) {
    return { error: 'not_found' };
  }

  item.status = 'completed';
  item.checklist = 100;
  return { data: item };
}

export function getAssets() {
  return assets;
}

export function allocateAsset(id, employeeName, actorRole) {
  if (!isPrivileged(actorRole)) {
    return { error: 'forbidden' };
  }

  const item = assets.find((asset) => asset.id === id);
  if (!item) {
    return { error: 'not_found' };
  }

  item.employee = employeeName;
  item.status = 'allocated';
  item.dueDate = '2027-03-31';
  return { data: item };
}

export function getPerformanceReviews() {
  return performance;
}

export function getRecruitmentPipeline() {
  return recruitment;
}

export function advanceRecruitmentStage(id, actorRole) {
  if (!isPrivileged(actorRole)) {
    return { error: 'forbidden' };
  }

  const req = recruitment.find((item) => item.id === id);
  if (!req) {
    return { error: 'not_found' };
  }

  const idx = recruitmentFlow.indexOf(req.stage);
  if (idx < recruitmentFlow.length - 1) {
    req.stage = recruitmentFlow[idx + 1];
  }

  return { data: req };
}

export function getAdminInsights() {
  const pendingLeaves = leaves.filter((leave) => leave.status === 'pending').length;
  const pendingPayroll = payrollRuns.filter((run) => run.status !== 'processed').length;
  const onboardingOpen = onboarding.filter((item) => item.status !== 'completed').length;
  const availableAssets = assets.filter((item) => item.status === 'available').length;

  return {
    pendingApprovals: pendingLeaves,
    payrollActions: pendingPayroll,
    onboardingOpen,
    availableAssets,
    totalEmployees: employees.length
  };
}

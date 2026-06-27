-- Database Performance Optimization Queries
-- Add indices to frequently queried columns

-- User queries
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");

-- Employee queries
CREATE INDEX IF NOT EXISTS idx_employee_user_id ON "Employee"("userId");
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON "Employee"("departmentId");
CREATE INDEX IF NOT EXISTS idx_employee_code ON "Employee"("employeeCode");

-- Attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON "Attendance"("userId");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON "Attendance"("userId", "date");

-- Leave request queries
CREATE INDEX IF NOT EXISTS idx_leave_request_user_id ON "LeaveRequest"("userId");
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS idx_leave_request_dates ON "LeaveRequest"("startDate", "endDate");

-- Performance review queries
CREATE INDEX IF NOT EXISTS idx_performance_review_employee_id ON "PerformanceReview"("employeeId");
CREATE INDEX IF NOT EXISTS idx_performance_review_date ON "PerformanceReview"("reviewDate");

-- Recruitment queries
CREATE INDEX IF NOT EXISTS idx_job_posting_status ON "JobPosting"("status");
CREATE INDEX IF NOT EXISTS idx_candidate_posting_id ON "Candidate"("jobPostingId");
CREATE INDEX IF NOT EXISTS idx_candidate_status ON "Candidate"("status");

-- Payroll queries
CREATE INDEX IF NOT EXISTS idx_payroll_user_id ON "Payroll"("userId");
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON "Payroll"("monthYear");

-- Department queries
CREATE INDEX IF NOT EXISTS idx_department_manager_id ON "Department"("managerId");

-- Task queries
CREATE INDEX IF NOT EXISTS idx_task_assigned_to ON "Task"("assignedTo");
CREATE INDEX IF NOT EXISTS idx_task_status ON "Task"("status");

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_status_date ON "Attendance"("userId", "status", "date");
CREATE INDEX IF NOT EXISTS idx_leave_request_user_status_date ON "LeaveRequest"("userId", "status", "startDate");
CREATE INDEX IF NOT EXISTS idx_employee_department_status ON "Employee"("departmentId", "status");

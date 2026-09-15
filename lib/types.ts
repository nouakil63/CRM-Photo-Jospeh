export type Student = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  class_name: string | null;
  expected_amount: number; // en centimes
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  student_id: string | null;
  stripe_id: string | null;
  amount: number; // en centimes
  currency: string;
  method: "stripe" | "especes" | "cheque" | "virement" | "autre";
  status: string;
  payer_email: string | null;
  description: string | null;
  paid_at: string;
  created_at: string;
};

export type StudentWithPayments = Student & { payments: Payment[] };

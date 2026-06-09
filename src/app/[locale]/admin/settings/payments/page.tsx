import { requireAdmin } from "@/lib/guards";
import { getPaymentSettingsForAdmin } from "@/lib/payments/queries";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export default async function PaymentSettingsPage() {
  await requireAdmin();
  const settings = await getPaymentSettingsForAdmin();
  return <PaymentSettingsForm settings={settings} />;
}

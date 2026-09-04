import open from "open";
import { apiClient } from "./apiClient";
import { getErrorMessage } from "./httpErrors";

export async function openUpgradeCheckout() {
  const response = await apiClient.billing.checkout.$post();

  if (response.ok) {
    const data = await response.json();
    await open(data.url);
    return;
  }
  throw new Error(await getErrorMessage(response));
}

export async function openBillingPortal() {
  const response = await apiClient.billing.portal.$post();

  if (response.ok) {
    const data = await response.json();
    await open(data.url);
    return;
  }
  throw new Error(await getErrorMessage(response));
}

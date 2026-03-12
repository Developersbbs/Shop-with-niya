import { Metadata } from "next";
import { notFound } from "next/navigation";
import { IoBagHandle, IoHeartOutline, IoCartOutline } from "react-icons/io5";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Typography from "@/components/ui/typography";
import PageTitle from "@/components/shared/PageTitle";

import CustomerOrdersTable from "./_components/Table";
import CustomerProfileCard from "./_components/CustomerProfileCard";
import WishlistTab from "./_components/WishlistTab";
import CartTab from "./_components/CartTab";
import {
  fetchCustomerOrders,
  fetchCustomerDetails,
  fetchCustomerWishlist,
  fetchCustomerCart
} from "@/services/customers";

import { Customer } from "@/types/api";

interface OrderForCard {
  _id: string;
  invoice_no: string;
  status: string;
  total_amount: number;
  order_time: string;
  payment_method: string;
  shipping_address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface ExtendedCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  orders: OrderForCard[];
  statistics: {
    total_orders: number;
    total_spent: number;
    order_statuses: Record<string, { count: number; total: number }>;
  };
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { customer } = await fetchCustomerDetails(id);
    return { title: (customer as Customer)?.name || 'Customer Profile' };
  } catch {
    return { title: "Customer not found" };
  }
}

export default async function CustomerOrders({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    const [
      { customer },
      { customerOrders },
      wishlistData,
      cartData
    ] = await Promise.all([
      fetchCustomerDetails(id),
      fetchCustomerOrders({ id }),
      fetchCustomerWishlist(id).catch(() => ({ items: [], totalItems: 0 })),
      fetchCustomerCart(id).catch(() => ({ items: [], totalItems: 0, cartTotal: 0 }))
    ]);
    data = { customer, customerOrders, wishlistData, cartData };
  } catch {
    console.error('Error loading customer data');
    return notFound();
  }

  const { customer, customerOrders, wishlistData, cartData } = data;

  return (
    <div className="space-y-6">
      <PageTitle>Customer Profile</PageTitle>

      {/* Customer Profile Card */}
      <CustomerProfileCard customer={{
        ...(customer as Customer),
        orders: (customerOrders as unknown as OrderForCard[]),
        statistics: (customer as unknown as { statistics: ExtendedCustomer['statistics'] }).statistics || {
          total_orders: customerOrders.length,
          total_spent: customerOrders.reduce((sum: number, order: { total_amount?: number }) => sum + (order.total_amount || 0), 0),
          order_statuses: {}
        }
      } as ExtendedCustomer} />

      {/* Tabs for Orders, Wishlist, and Cart */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <IoBagHandle className="h-4 w-4" />
            <span>Orders</span>
            {customerOrders.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {customerOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex items-center gap-2">
            <IoHeartOutline className="h-4 w-4" />
            <span>Wishlist</span>
            {wishlistData.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {wishlistData.totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center gap-2">
            <IoCartOutline className="h-4 w-4" />
            <span>Cart</span>
            {cartData.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {cartData.totalItems}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order History</h2>
            <div className="text-sm text-muted-foreground">
              {customerOrders.length} {customerOrders.length === 1 ? 'order' : 'orders'} total
            </div>
          </div>

          {customerOrders.length === 0 ? (
            <Card className="w-full flex flex-col items-center justify-center py-12 text-center">
              <IoBagHandle className="text-muted-foreground size-12 mb-4" />
              <Typography variant="h4" className="mb-2">No Orders Yet</Typography>
              <Typography className="text-muted-foreground">This customer hasn&apos;t placed any orders yet.</Typography>
            </Card>
          ) : (
            <CustomerOrdersTable data={customerOrders} />
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <WishlistTab
            items={wishlistData.items}
            totalItems={wishlistData.totalItems}
          />
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          <CartTab
            items={cartData.items}
            totalItems={cartData.totalItems}
            cartTotal={cartData.cartTotal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

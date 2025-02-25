import { CreditCard, Landmark, Wallet, Contactless, Clock, Smartphone } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useBookingState } from "@/context/BookingContext"

export default function PaymentSelector() {
  const { state } = useBookingState()

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight">Select your payment method</h2>

      <RadioGroup defaultValue="card" className="grid grid-cols-2 gap-4">
        {/* Apple Pay */}
        <div className="relative">
          <RadioGroupItem value="apple" id="apple" className="peer sr-only" />
          <Label
            htmlFor="apple"
            className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Smartphone className="h-6 w-6 mb-2" />
            Apple Pay
          </Label>
        </div>

        {/* Credit Card */}
        <div className="relative">
          <RadioGroupItem value="card" id="card" className="peer sr-only" />
          <Label
            htmlFor="card"
            className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <CreditCard className="h-6 w-6 mb-2" />
            Credit Card
          </Label>
        </div>

        {/* Bank Transfer */}
        <div className="relative">
          <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
          <Label
            htmlFor="bank"
            className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Landmark className="h-6 w-6 mb-2" />
            Bank Transfer
          </Label>
        </div>

        {/* PayPal */}
        <div className="relative">
          <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
          <Label
            htmlFor="paypal"
            className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Wallet className="h-6 w-6 mb-2" />
            PayPal
          </Label>
        </div>

        {/* Pay Later */}
        <div className="relative">
          <RadioGroupItem value="later" id="later" className="peer sr-only" />
          <Label
            htmlFor="later"
            className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Clock className="h-6 w-6 mb-2" />
            Pay Later
          </Label>
        </div>
      </RadioGroup>

      {/* Total Price */}
      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-lg font-medium">Total amount</span>
        <span className="text-2xl font-bold">
          €{state.totalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
import { useState, useContext, createContext } from 'react'
import { CreditCard, Landmark, Wallet, Contactless, Clock, Smartphone } from 'lucide-react'
import { useBookingState } from '@/context/BookingContext'
import { useUrlSearchParams } from '@/context/UrlSearchParamsContext'
import { useRouter } from 'next/navigation'

// Radio Group Components
const RadioGroupContext = createContext()

export const RadioGroup = ({ defaultValue, className, children, onValueChange }) => {
  const [value, setValue] = useState(defaultValue || '')

  const handleChange = (newValue) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <RadioGroupContext.Provider value={{ value, onChange: handleChange }}>
      <div className={`grid gap-2 ${className || ''}`} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export const RadioGroupItem = ({ value, id, className }) => {
  const context = useContext(RadioGroupContext)
  
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup')
  }

  return (
    <input
      type="radio"
      id={id}
      name={id}
      value={value}
      checked={context.value === value}
      onChange={(e) => context.onChange(e.target.value)}
      className={`peer h-4 w-4 shrink-0 rounded-full border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    />
  )
}

// Payment Selector Component
export default function PaymentSelector({onSuccess}) {
  const router = useRouter();
  const { state, clearAllBookings } = useBookingState()
  const { clearParams } = useUrlSearchParams();
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('later')

  const handleBooking = async () => {
    if(state.bookingPeriods.length <= 0 ) {
      setMessage("Somethings went wrongs.");
      return false;
    } 
    setLoading(true)
    setMessage('')
    
    try {
      const bookingData = {
        ...state,
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'later' ? 'pending' : 'completed'
      }

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Payment processing failed')
      }

      setMessage('Booking successful! Redirecting...')
      setSuccess(true)
      clearAllBookings();
      clearParams();
      onSuccess();
      
      // setTimeout(() => { ; setSuccess(false) } , 1000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment processing failed')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6 text-center">
        <div className="space-y-4">
          <div className="inline-flex bg-green-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h3>
          <p className="text-gray-600">
            {selectedPayment === 'later' 
              ? 'Your reservation is secured. Please settle payment at check-in.'
              : 'Payment processed successfully. Enjoy your stay!'}
          </p>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          Return to Homepage
        </button>
      </div>
    )
  }


  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Select Payment Method</h2>

      <RadioGroup 
        defaultValue="card"
        onValueChange={setSelectedPayment}
        className="grid grid-cols-2 gap-4"
      >
        {[
          { value: 'apple', label: 'Apple Pay', icon: Smartphone },
          { value: 'card', label: 'Credit Card', icon: CreditCard },
          { value: 'bank', label: 'Bank Transfer', icon: Landmark },
          { value: 'paypal', label: 'PayPal', icon: Wallet },
          { value: 'later', label: 'Pay Later', icon: Clock , active : true },
        ].map((method) => (
          <div  key={method.value} className={`relative ${method.active ? "" : "opacity-45 pointer-events-none cursor-not-allowed"}`}>
            <RadioGroupItem 
              value={method.value} 
              id={method.value} 
              className="sr-only" 
            />
            <label
              htmlFor={method.value}
              className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-checked:border-blue-500 cursor-pointer"
            >
              <method.icon className="h-6 w-6 mb-2 text-gray-700" />
              <span className="text-sm font-medium">{method.label}</span>
            </label>
          </div>
        ))}
      </RadioGroup>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Total</span>
          <span className="text-2xl font-bold">
            €{state.totalPrice.toFixed(2)}
          </span>
        </div>

        <button 
          onClick={handleBooking}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            selectedPayment === 'later' ? 'Confirm Booking' : 'Pay Now'
          )}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
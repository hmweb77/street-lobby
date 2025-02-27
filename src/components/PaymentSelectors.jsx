import { useState, useContext, createContext } from 'react'
import { CreditCard, Landmark, Wallet, Contactless, Clock, Smartphone } from 'lucide-react'
import { useBookingState } from '@/context/BookingContext'

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
export default function PaymentSelector() {
  const { state, clearAllBooking } = useBookingState()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('card')

  const handleBooking = async () => {
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
      clearAllBooking()
      
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment processing failed')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-4 text-center">
        <h3 className="text-2xl font-semibold text-green-600">Booking Confirmed!</h3>
        <p className="text-gray-500">
          {selectedPayment === 'later' 
            ? 'Please settle payment at check-in. Confirmation email sent.'
            : 'Payment processed successfully. Confirmation email sent.'}
        </p>
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
          { value: 'later', label: 'Pay Later', icon: Clock },
        ].map((method) => (
          <div key={method.value} className="relative">
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
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
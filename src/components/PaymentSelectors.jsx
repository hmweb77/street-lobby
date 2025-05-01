import {
  useState,
  useContext,
  createContext,
  useEffect,
  useCallback,
} from "react";
import {
  CreditCard,
  Landmark,
  Wallet,
  Contactless,
  Clock,
  Smartphone,
} from "lucide-react";
import { useBookingState } from "@/context/BookingContext";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import { useRouter } from "next/navigation";

// Radio Group Components
const RadioGroupContext = createContext();

export const RadioGroup = ({
  defaultValue,
  className,
  children,
  onValueChange,
}) => {
  const [value, setValue] = useState(defaultValue || "");

  const handleChange = (newValue) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider value={{ value, onChange: handleChange }}>
      <div className={`grid gap-2 ${className || ""}`} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = ({ value, id, className }) => {
  const context = useContext(RadioGroupContext);

  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }

  return (
    <input
      type="radio"
      id={id}
      name={id}
      value={value}
      checked={context.value === value}
      onChange={(e) => context.onChange(e.target.value)}
      className={`peer accent-black h-4 w-4 shrink-0 rounded-full border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    />
  );
};

const Timer = ({ initialSeconds, onExpire }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const formatTime = (time) => String(time).padStart(2, "0");
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="flex items-center gap-2 text-red-600 font-medium">
      <Clock className="w-5 h-5" />
      <span className="text-xl">
        {formatTime(minutes)}:{formatTime(remainingSeconds)}
      </span>
    </div>
  );
};

const TimeLimitNotice = ({ handleTimerExpire }) => (
  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-8">
    <div className="flex items-center gap-4">
      {/* <div className="flex-shrink-0">
        <Clock className="w-6 h-6 text-amber-600" />
      </div> */}
      <div>
        <h3 className="text-lg font-semibold text-amber-800 mb-1">
          Complete your booking within
        </h3>
        <div className="flex items-center gap-3">
          <Timer initialSeconds={1800} onExpire={handleTimerExpire} />
          <p className="text-sm text-amber-700">
            Your selected rooms are reserved temporarily. Please complete your
            booking before time runs out to guarantee your reservation.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Timer Component

const PaymentApi = {
  card: {
    api: "/api/stripe-pay",
    redirectOnSuccess: true,
  },
  paypal: {
    api: "/api/paypal-pay",
    redirectOnSuccess: true,
  },
  later: {
    api: "/api/later-pay",
    redirectOnSuccess: false,
  },
};

export default function PaymentSelector({ onSuccess }) {
  const router = useRouter();
  const { state, clearAllBookings } = useBookingState();
  const { clearParams } = useUrlSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paypalApprovals, setPaypalApprovals] = useState(null);

  const [approvedIndices, setApprovedIndices] = useState([]);

  // Add useEffect for redirection
  useEffect(() => {
    if (paypalApprovals && approvedIndices.length === paypalApprovals.length) {
      router.push("/payment-success");
    }
  }, [approvedIndices, paypalApprovals, router]);

  const handleBooking = async () => {
    if (state.bookingPeriods.length <= 0) {
      setMessage("Something went wrong.");
      return false;
    }
    setLoading(true);
    setMessage("");

    try {
      const bookingData = {
        ...state,
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === "later" ? "pending" : "completed",
      };

      const response = await fetch(PaymentApi[selectedPayment].api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment processing failed");
      }

      const responseData = await response.json();

      if (PaymentApi[selectedPayment].redirectOnSuccess) {
        if (
          selectedPayment === "paypal" &&
          responseData.paymentDetails?.length > 1
        ) {
          setPaypalApprovals(responseData.paymentDetails);
          clearAllBookings();
          clearParams();
          console.log("Here is the details");
          return;
        }
        if (responseData.paymentDetails?.length === 1) {
          window.location.replace(responseData.paymentDetails[0].approvalUrl);
          return;
        }
        window.location.replace(responseData.redirectUrl);
        return;
      }

      setMessage("Booking successful! Redirecting...");
      setSuccess(true);
      clearAllBookings();
      clearParams();
      onSuccess();

      setTimeout(() => {
        setSuccess(false);
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Payment processing failed"
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerExpire = useCallback(() => {
    setTimerExpired(true);
    clearAllBookings();
    clearParams();
  }, [clearAllBookings, clearParams]);

  const [timerExpired, setTimerExpired] = useState(false);

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6 text-center">
        <div className="space-y-4">
          <div className="inline-flex bg-green-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            Booking Confirmed!
          </h3>
          <p className="text-gray-600">
            {selectedPayment === "later"
              ? "Your reservation is secured. Please settle payment at check-in."
              : "Payment processed successfully. Enjoy your stay!"}
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  if (timerExpired) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6 text-center">
        <div className="space-y-4">
          <div className="inline-flex bg-red-100 p-3 rounded-full">
            <Clock className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Session Expired</h3>
          <p className="text-gray-600">
            Your reservation session has expired. Please start a new booking.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 transition-colors"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  if (paypalApprovals) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-screen p-6 space-y-8">
        <TimeLimitNotice handleTimerExpire={handleTimerExpire} />

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            For the PayPal payment policies, you need to approve the payments
            one by one. After confirming all payments, your booking will be
            finalized.
          </p>
        </div>

        {paypalApprovals.map((detail, index) => {
          const isApproved = approvedIndices.includes(index);
          return (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  {detail.customDetails.roomTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Semester:</span>
                    <span>{detail.customDetails.semester}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Academic Year:</span>
                    <span>{detail.customDetails.year}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Payment Type:</span>
                    <span>
                      {detail.customDetails.semester.includes("Semester")
                        ? "Semester/Monthly"
                        : "Total"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {detail.planData.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">
                  {detail.customDetails.semester.includes("Semester")
                    ? "Semester"
                    : "Total"}{" "}
                  Amount:
                </span>
                <span className="text-xl font-bold">
                  €{detail.customDetails.amount.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  setApprovedIndices((prev) => [...prev, index]);
                  window.open(detail.approvalUrl, "_blank");
                }}
                disabled={isApproved}
                className={`w-full bg-gray-900 text-white py-3 px-6 rounded-lg transition-colors font-medium ${
                  isApproved
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-800"
                }`}
              >
                {isApproved
                  ? "Approval Started"
                  : `Approve ${detail.customDetails.semester.includes("Semester") ? "Semester" : "Total"} Payment`}
              </button>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="text-center text-sm text-gray-500">
            {approvedIndices.length} of {paypalApprovals.length} payments
            approved
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen p-6 space-y-8">
      <TimeLimitNotice handleTimerExpire={handleTimerExpire} />
      <h2 className="text-2xl font-semibold">Select Your Payment Method</h2>

      <RadioGroup
        defaultValue="card"
        disabled={loading}
        onValueChange={setSelectedPayment}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {[
          // { value: "apple", label: "Apple Pay", img: "/applepay.png" },
          {
            value: "card",
            label: "Credit Card",
            img: "/creditcard.png",
            active: true,
          },
          // { value: "bank", label: "Bank Transfer", img: "/banktransfer.png" },
          // {
          //   value: "paypal",
          //   label: "PayPal",
          //   img: "/paypal.png",
          //   active: true,
          // },
          // { value: "later", label: "Pay Later", img: "/pay-later.png" },
        ].map((method) => (
          <div
            onClick={() => setSelectedPayment(method.value)}
            key={method.value}
            className={`relative ${selectedPayment === method.value ? "border-2 border-blue-500 rounded-lg" : ""}  ${method.active ? "" : "opacity-45 pointer-events-none cursor-not-allowed"}`}
          >
            <RadioGroupItem
              value={method.value}
              id={method.value}
              className="sr-only"
            />
            <label
              htmlFor={method.value}
              className={`  flex flex-col items-center justify-center h-24 rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50  cursor-pointer`}
            >
              <img src={method.img} className="h-6 w-6 mb-2 text-gray-700" />
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
          disabled={loading || !selectedPayment}
          className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : selectedPayment === "later" ? (
            "Confirm Booking"
          ) : (
            "Pay Now"
          )}
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

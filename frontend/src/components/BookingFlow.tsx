import React, { useReducer, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import CheckoutPanel from './CheckoutPanel';
import type { Service, StaffMember } from '../types/audience';

// Mock service categories matching Phase 6 spec
const SERVICE_CATEGORIES = [
  { slug: 'hair', label: 'Hair & Salon', icon: '✂️' },
  { slug: 'spa', label: 'Spa & Massage', icon: '🌿' },
  { slug: 'nails', label: 'Nails & Beauty', icon: '💅' },
  { slug: 'barbers', label: 'Barbers', icon: '💈' },
  { slug: 'medspa', label: 'MedSpa & Aesthetics', icon: '✨' },
  { slug: 'fitness', label: 'Fitness & Personal Training', icon: '🏋️' },
  { slug: 'wellness', label: 'Wellness & Recovery', icon: '🧘' },
  { slug: 'other', label: 'Other Services', icon: '🌟' }
];

// Mock services data
const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Hair Cut & Style', category: 'hair', duration_minutes: 60, price: 45, description: 'Professional haircut with styling' },
  { id: '2', name: 'Hair Color', category: 'hair', duration_minutes: 120, price: 85, description: 'Full color service with consultation' },
  { id: '3', name: 'Swedish Massage', category: 'spa', duration_minutes: 90, price: 95, description: 'Relaxing full-body massage' },
  { id: '4', name: 'Facial Treatment', category: 'spa', duration_minutes: 60, price: 75, description: 'Deep cleansing and hydrating facial' },
  { id: '5', name: 'Manicure', category: 'nails', duration_minutes: 45, price: 35, description: 'Classic manicure service' },
  { id: '6', name: 'Pedicure', category: 'nails', duration_minutes: 60, price: 45, description: 'Relaxing pedicure service' },
];

// Mock staff
const MOCK_STAFF: StaffMember[] = [
  { id: '1', name: 'Sarah', role: 'therapist', photo_url: 'https://via.placeholder.com/40', rating: 4.8, nextAvailable: '2:30 PM' },
  { id: '2', name: 'Emma', role: 'therapist', photo_url: 'https://via.placeholder.com/40', rating: 4.9, nextAvailable: '3:00 PM' },
  { id: '3', name: 'James', role: 'therapist', photo_url: 'https://via.placeholder.com/40', rating: 4.7, nextAvailable: '2:00 PM' },
];

interface BookingState {
  step: 1 | 2 | 3 | 4;
  selectedCategory: string | null;
  selectedService: Service | null;
  selectedStaff: StaffMember | null;
  selectedDate: string | null;
  selectedTime: string | null;
  loyaltyApplied: boolean;
  notes: string;
  showPayment: boolean;
}

type BookingAction = 
  | { type: 'SELECT_CATEGORY'; payload: string }
  | { type: 'SELECT_SERVICE'; payload: Service }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SELECT_STAFF'; payload: StaffMember }
  | { type: 'SELECT_DATE'; payload: string }
  | { type: 'SELECT_TIME'; payload: string }
  | { type: 'TOGGLE_LOYALTY' }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SHOW_PAYMENT'; payload: boolean }
  | { type: 'RESET' };

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SELECT_CATEGORY':
      return { ...state, selectedCategory: action.payload, selectedService: null };
    case 'SELECT_SERVICE':
      return { ...state, selectedService: action.payload };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(4, state.step + 1) as 1 | 2 | 3 | 4 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) as 1 | 2 | 3 | 4 };
    case 'SELECT_STAFF':
      return { ...state, selectedStaff: action.payload };
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SELECT_TIME':
      return { ...state, selectedTime: action.payload };
    case 'TOGGLE_LOYALTY':
      return { ...state, loyaltyApplied: !state.loyaltyApplied };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SHOW_PAYMENT':
      return { ...state, showPayment: action.payload };
    case 'RESET':
      return {
        step: 1,
        selectedCategory: null,
        selectedService: null,
        selectedStaff: null,
        selectedDate: null,
        selectedTime: null,
        loyaltyApplied: false,
        notes: '',
        showPayment: false
      };
    default:
      return state;
  }
};

export default function BookingFlow() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(bookingReducer, {
    step: 1,
    selectedCategory: null,
    selectedService: null,
    selectedStaff: null,
    selectedDate: null,
    selectedTime: null,
    loyaltyApplied: false,
    notes: '',
    showPayment: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredServices = state.selectedCategory
    ? MOCK_SERVICES.filter(s => s.category === state.selectedCategory)
    : [];
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConfirmBooking = async () => {
    if (!state.selectedService || !state.selectedStaff || !state.selectedDate || !state.selectedTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Show payment form
      dispatch({ type: 'SHOW_PAYMENT', payload: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Create booking in backend
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: state.selectedService?.id,
          staff_id: state.selectedStaff?.id,
          scheduled_at: `${state.selectedDate}T${state.selectedTime}:00Z`,
          client_notes: state.notes,
          payment_intent_id: paymentIntentId,
          loyalty_applied: state.loyaltyApplied
        })
      });

      if (bookingResponse.ok) {
        setBookingMessage({
          type: 'success',
          text: 'Booking confirmed! Check your email for details.'
        });
        setTimeout(() => {
          dispatch({ type: 'RESET' });
          setBookingMessage(null);
        }, 3000);
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      setBookingMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to complete booking'
      });
    }
  };

  const handlePaymentError = (error: string) => {
    setBookingMessage({
      type: 'error',
      text: error
    });
    dispatch({ type: 'SHOW_PAYMENT', payload: false });
  };

  return (
    <div style={{
      background: 'var(--color-background-dark)',
      minHeight: '100vh',
      padding: '24px 28px',
      color: 'var(--color-text-primary)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Book Your Service</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>3 simple steps to reserve your appointment</p>
      </div>

      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 40
      }}>
        {[1, 2, 3].map(step => (
          <div
            key={step}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              transition: 'all 0.3s',
              background: state.step >= step ? 'var(--color-accent-teal)' : 'var(--color-border)',
              color: state.step >= step ? '#0a0c12' : 'var(--color-text-secondary)'
            }}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Step 1: Service Selection */}
      {state.step === 1 && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Step 1: Select Service Type</h2>

          {/* Category Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            marginBottom: 32
          }}>
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => dispatch({ type: 'SELECT_CATEGORY', payload: cat.slug })}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  border: state.selectedCategory === cat.slug ? '2px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                  background: state.selectedCategory === cat.slug ? 'var(--color-accent-teal-dim)' : 'var(--color-background-card)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 12,
                  transition: 'all 0.2s',
                  transform: state.selectedCategory === cat.slug ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600 }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* Service List */}
          {filteredServices.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                Available Services
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => dispatch({ type: 'SELECT_SERVICE', payload: service })}
                    style={{
                      padding: '16px',
                      borderRadius: 12,
                      border: state.selectedService?.id === service.id ? '2px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                      background: state.selectedService?.id === service.id ? 'var(--color-accent-teal-dim)' : 'var(--color-background-card)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{service.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {service.duration_minutes} mins
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent-teal)' }}>
                        £{service.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next Button */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              disabled={!state.selectedService}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: state.selectedService ? 'var(--color-accent-teal)' : 'var(--color-border)',
                color: state.selectedService ? '#0a0c12' : 'var(--color-text-tertiary)',
                fontWeight: 700,
                cursor: state.selectedService ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Continue to Staff &amp; Time
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Staff & Time Selection */}
      {state.step === 2 && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Step 2: Select Staff &amp; Time</h2>

          {/* Staff Selection */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              Choose Your Therapist
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {MOCK_STAFF.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => dispatch({ type: 'SELECT_STAFF', payload: staff })}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: state.selectedStaff?.id === staff.id ? '2px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                    background: state.selectedStaff?.id === staff.id ? 'var(--color-accent-teal-dim)' : 'var(--color-background-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={staff.photo_url}
                      alt={staff.name}
                      style={{ width: 60, height: 60, borderRadius: '50%', marginBottom: 8, objectFit: 'cover' }}
                    />
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{staff.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      ⭐ {staff.rating}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-accent-teal)', marginTop: 4 }}>
                      Available: {staff.nextAvailable}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          {state.selectedStaff && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
                Select Date &amp; Time
              </h3>

              {/* 7-day scrollable date picker */}
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                marginBottom: 16,
                paddingBottom: 8
              }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <button
                      key={dateStr}
                      onClick={() => dispatch({ type: 'SELECT_DATE', payload: dateStr })}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: state.selectedDate === dateStr ? '2px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                        background: state.selectedDate === dateStr ? 'var(--color-accent-teal-dim)' : 'var(--color-background-card)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{dayName}</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{date.getDate()}</div>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {state.selectedDate && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 8
                }}>
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                    <button
                      key={time}
                      onClick={() => dispatch({ type: 'SELECT_TIME', payload: time })}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: state.selectedTime === time ? '2px solid var(--color-accent-teal)' : '1px solid var(--color-border)',
                        background: state.selectedTime === time ? 'var(--color-accent-teal-dim)' : 'var(--color-background-card)',
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button
              onClick={() => dispatch({ type: 'PREV_STEP' })}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              disabled={!state.selectedStaff || !state.selectedDate || !state.selectedTime}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: state.selectedStaff && state.selectedDate && state.selectedTime ? 'var(--color-accent-teal)' : 'var(--color-border)',
                color: state.selectedStaff && state.selectedDate && state.selectedTime ? '#0a0c12' : 'var(--color-text-tertiary)',
                fontWeight: 700,
                cursor: state.selectedStaff && state.selectedDate && state.selectedTime ? 'pointer' : 'not-allowed'
              }}
            >
              Review &amp; Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation & Payment */}
      {state.step === 3 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Step 3: Confirm Booking</h2>

          {bookingMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: bookingMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              color: bookingMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              marginBottom: 16,
              fontSize: 13
            }}>
              {bookingMessage.text}
            </div>
          )}

          {/* Summary Card */}
          <div style={{
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            background: 'var(--color-background-card)',
            marginBottom: 24
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>Service</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{state.selectedService?.name}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 4 }}>
                {state.selectedService?.duration_minutes} mins • £{state.selectedService?.price}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <img
                  src={state.selectedStaff?.photo_url}
                  alt={state.selectedStaff?.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Therapist</div>
                  <div style={{ fontWeight: 700 }}>{state.selectedStaff?.name}</div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>Date &amp; Time</div>
                <div style={{ fontWeight: 700 }}>
                  {state.selectedDate && new Date(state.selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}{' '}
                  at {state.selectedTime}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Service</span>
                <span>£{state.selectedService?.price}</span>
              </div>
              {state.loyaltyApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--color-success)' }}>
                  <span>Loyalty discount</span>
                  <span>-£5</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 700, 
                fontSize: 16,
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)'
              }}>
                <span>Total</span>
                <span>£{state.loyaltyApplied ? (state.selectedService?.price ?? 0) - 5 : state.selectedService?.price}</span>
              </div>
            </div>
          </div>

          {/* Loyalty Toggle */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--color-accent-teal-dim)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <input
              type="checkbox"
              checked={state.loyaltyApplied}
              onChange={() => dispatch({ type: 'TOGGLE_LOYALTY' })}
              style={{ cursor: 'pointer' }}
            />
            <label style={{ cursor: 'pointer', flex: 1 }}>
              Apply loyalty points (save £5)
            </label>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Any notes for your therapist? (optional)"
            value={state.notes}
            onChange={(e) => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-background-card)',
              color: 'var(--color-text-primary)',
              marginBottom: 24,
              minHeight: 80,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />

          {/* Show Payment Form or Buttons */}
          {!state.showPayment ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button
                onClick={() => dispatch({ type: 'PREV_STEP' })}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--color-accent-teal)',
                  color: '#0a0c12',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm &amp; Pay'}
              </button>
            </div>
          ) : (
            <div>
              <CheckoutPanel
                amount={state.loyaltyApplied ? (state.selectedService?.price ?? 0) - 5 : state.selectedService?.price ?? 0}
                currency="gbp"
                description="Complete your booking payment"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              <button
                onClick={() => dispatch({ type: 'SHOW_PAYMENT', payload: false })}
                style={{
                  marginTop: 16,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

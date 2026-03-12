import { ArrowLeft } from 'lucide-react';

type View = 'home' | 'portfolio' | 'services' | 'booking' | 'about' | 'contact' | 'portal' | 'admin' | 'login' | 'settings' | 'terms' | 'privacy' | 'cancellation';

function LegalPageWrapper({ title, children, setView }: { title: string; children: React.ReactNode; setView: (v: View) => void }) {
  return (
    <section className="min-h-screen bg-background text-foreground py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 text-[#cbb26a] hover:text-[#8f5e25] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <h1 className="text-4xl font-bold mb-2 text-[#cbb26a]">{title}</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300 leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

export function TermsOfServicePage({ setView }: { setView: (v: View) => void }) {
  return (
    <LegalPageWrapper title="Terms of Service" setView={setView}>
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
        <p>By accessing or using the services provided by Thomas Samuel Media ("Company," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">2. Services</h2>
        <p>Thomas Samuel Media provides professional photography, videography, drone aerial media, 3D virtual tours, and related media production services for real estate, commercial, and residential properties. Service details, deliverables, and timelines are outlined in the selected package at the time of booking.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">3. Booking & Payment</h2>
        <p>All bookings are confirmed upon receipt of payment. Pricing is based on the selected package and property size tier. Payment is due at the time of booking unless otherwise agreed upon in writing. We accept major credit cards and other payment methods as displayed during checkout.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">4. Scheduling & Access</h2>
        <p>Clients are responsible for ensuring property access at the scheduled time. If the property is not accessible at the time of the appointment, a rescheduling fee may apply. We will make reasonable efforts to accommodate schedule changes with at least 24 hours' notice.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">5. Deliverables & Turnaround</h2>
        <p>Edited media will be delivered electronically within the timeframe specified for the selected package, typically within 24–48 hours. Rush delivery may be available for an additional fee. All deliverables remain the intellectual property of Thomas Samuel Media until full payment is received.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">6. Usage Rights</h2>
        <p>Upon full payment, clients receive a non-exclusive, perpetual license to use the delivered media for marketing and promotional purposes related to the photographed property. Thomas Samuel Media retains the right to use all media for portfolio, marketing, and promotional purposes unless otherwise agreed in writing.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
        <p>Thomas Samuel Media shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid for the specific service in question. We are not responsible for delays caused by weather, property access issues, or other circumstances beyond our control.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">8. Modifications</h2>
        <p>We reserve the right to modify these Terms of Service at any time. Changes will be posted on our website and take effect immediately. Continued use of our services constitutes acceptance of the updated terms.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
        <p>If you have questions about these Terms of Service, please contact us at <a href="mailto:Thomassamuelmedia@gmail.com" className="text-[#cbb26a] hover:underline">Thomassamuelmedia@gmail.com</a>.</p>
      </div>
    </LegalPageWrapper>
  );
}

export function PrivacyPolicyPage({ setView }: { setView: (v: View) => void }) {
  return (
    <LegalPageWrapper title="Privacy Policy" setView={setView}>
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
        <p>We collect information you provide directly to us when booking services, creating an account, or contacting us. This may include your name, email address, phone number, property address, and payment information. We also automatically collect certain technical information when you visit our website, including IP address, browser type, and usage data.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
        <p>We use the information we collect to provide and improve our services, process bookings and payments, communicate with you about your projects, send appointment confirmations and delivery notifications, and respond to your inquiries. We may also use your information to send occasional marketing communications, which you can opt out of at any time.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our business (such as payment processors and email services), but only to the extent necessary to provide our services. We may also disclose information when required by law.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
        <p>We implement reasonable security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">5. Cookies & Tracking</h2>
        <p>Our website uses cookies and similar technologies to enhance your browsing experience, analyze site traffic, and understand usage patterns. You can control cookie settings through your browser preferences. Disabling cookies may affect certain features of our website.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">6. Property Media</h2>
        <p>Photos, videos, and other media captured during our services may depict the exterior and interior of client properties. We take care to ensure that personal belongings and identifying information visible in media are handled with discretion. Clients are encouraged to secure personal items before scheduled shoots.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal information. You may also request a copy of the data we hold about you. To exercise these rights, please contact us at <a href="mailto:Thomassamuelmedia@gmail.com" className="text-[#cbb26a] hover:underline">Thomassamuelmedia@gmail.com</a>.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.</p>
      </div>
    </LegalPageWrapper>
  );
}

export function CancellationPolicyPage({ setView }: { setView: (v: View) => void }) {
  return (
    <LegalPageWrapper title="Cancellation Policy" setView={setView}>
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">1. Cancellation Window</h2>
        <p>Clients may cancel or reschedule a booking free of charge up to <strong className="text-white">24 hours</strong> before the scheduled appointment time. Cancellations made within 24 hours of the appointment are subject to the full service fee and are non-refundable.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">2. Rescheduling</h2>
        <p>We understand that schedules change. You may reschedule your appointment at no additional cost provided you give at least 24 hours' notice. Rescheduling requests made within 24 hours of the appointment may be accommodated on a case-by-case basis but are not guaranteed.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">3. No-Shows</h2>
        <p>If the property is not accessible or the client is not available at the scheduled time without prior notice, this will be treated as a no-show. No-shows are charged the full service fee with no refund. A new booking and payment will be required to reschedule.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">4. Weather & Force Majeure</h2>
        <p>In the event of severe weather or other conditions beyond our control that prevent safe execution of the shoot (particularly for drone and exterior work), we will work with you to reschedule at no additional cost. We will make every reasonable effort to accommodate your preferred timeline.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">5. Refund Process</h2>
        <p>Eligible refunds will be processed to the original payment method within 5–10 business days. If you have questions about a refund or need to cancel a booking, please contact us as soon as possible at <a href="mailto:Thomassamuelmedia@gmail.com" className="text-[#cbb26a] hover:underline">Thomassamuelmedia@gmail.com</a>.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">6. Partial Cancellations</h2>
        <p>If you wish to downgrade your package or remove add-on services, please contact us at least 24 hours before your appointment. Adjustments made after the shoot has been completed are not eligible for refunds.</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
        <p>For all cancellation and rescheduling requests, please email <a href="mailto:Thomassamuelmedia@gmail.com" className="text-[#cbb26a] hover:underline">Thomassamuelmedia@gmail.com</a> or call us at the number listed on our contact page.</p>
      </div>
    </LegalPageWrapper>
  );
}

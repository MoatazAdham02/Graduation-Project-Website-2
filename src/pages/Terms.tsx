import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Legal.css';

export default function Terms() {
  return (
    <div className="legal-page">
      <motion.div
        className="legal-card container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: March 2025</p>

        <section>
          <h2>1. Acceptance</h2>
          <p>
            By using COROnet, you agree to these Terms of Service. If you are using the service on behalf of an organization, you represent that you have authority to bind that organization.
          </p>
        </section>

        <section>
          <h2>2. Use of the service</h2>
          <p>
            You agree to use COROnet only for lawful purposes and in compliance with applicable laws, including healthcare regulations. You are responsible for maintaining the confidentiality of your account and for all activity under your account.
          </p>
        </section>

        <section>
          <h2>3. Medical disclaimer</h2>
          <p>
            COROnet is a tool to assist healthcare professionals. It is not a substitute for professional medical judgment. Always verify AI-generated findings and use the platform in accordance with your institution&apos;s policies.
          </p>
        </section>

        <section>
          <h2>4. Limitation of liability</h2>
          <p>
            To the extent permitted by law, COROnet and its providers shall not be liable for indirect, incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2>5. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <p className="legal-back">
          <Link to="/">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Legal.css';

export default function Privacy() {
  return (
    <div className="legal-page">
      <motion.div
        className="legal-card container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: March 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            COROnet (&quot;we&quot;, &quot;our&quot;) is committed to protecting your privacy. This policy describes how we collect, use, and safeguard information when you use our medical imaging platform.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <p>
            We collect information you provide (account details, profile data), usage data (how you use the service), and technical data (IP address, device information). Medical images and reports are processed in accordance with our data processing agreements.
          </p>
        </section>

        <section>
          <h2>3. How we use your information</h2>
          <p>
            We use your information to provide and improve the service, comply with legal obligations, and communicate with you. We do not sell your personal or health information.
          </p>
        </section>

        <section>
          <h2>4. Security and compliance</h2>
          <p>
            We use industry-standard encryption and security measures. Our practices are designed to support HIPAA and other applicable regulations where relevant.
          </p>
        </section>

        <section>
          <h2>5. Contact</h2>
          <p>
            For privacy-related questions, contact us at privacy@coronet.example.
          </p>
        </section>

        <p className="legal-back">
          <Link to="/">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}

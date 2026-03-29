import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, Printer, Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './ReportDetail.css';

/** Matches the ICC CARDIAC CT Word template (two-page layout). */
export type CardiacCTSubsection = {
  heading: string;
  lines: string[];
};

export type CardiacCTReport = {
  bannerTitle: string;
  status: string;
  patientName: string;
  sex: string;
  age: string;
  scanDate: string;
  indicationLabel: string;
  indication: string;
  techniques: string[];
  conclusions: string[];
  sectionsIntro: string;
  sectionsOutline: { roman: string; label: string }[];
  page2: {
    section1Title: string;
    ctaIntro: string;
    ctaSubsections: CardiacCTSubsection[];
    section2Title: string;
    chamberLines: string[];
    section3Title: string;
    calciumLines: string[];
  };
};

const CARDIAC_CT_ICC_0206: CardiacCTReport = {
  bannerTitle: 'CARDIAC CT Report',
  status: 'Final',
  patientName: 'ICC_Patient_0206',
  sex: 'F',
  age: '059Y',
  scanDate: '20-01-2026',
  indicationLabel: 'Indication for Cardiac CT',
  indication: 'Risk stratification',
  techniques: [
    'High-resolution non-contrast CT images were obtained for coronary artery calcium scoring using 3 mm slice thickness with prospective ECG gating.',
    'CT angiography was performed following intravenous administration of 80 ml iodinated contrast medium on a Toshiba Aquilion 128-slice MSCT system (gantry rotation 400 msec, 0.5 mm slice thickness, images reconstructed at 2 mm).',
    'Interactive review and analysis were performed on a Vitrea 3D workstation for calcium scoring, coronary anatomy, and assessment of left ventricular function.',
  ],
  conclusions: [
    'Right dominant coronary system.',
    'No coronary calcium accumulation.',
    'No evidence of significant coronary artery disease.',
    'Globally preserved LV function.',
  ],
  sectionsIntro: 'This report consists of three sections:',
  sectionsOutline: [
    { roman: 'I.', label: 'CT CORONARY ANGIOGRAPHY (CTA)' },
    { roman: 'II.', label: 'CARDIAC CHAMBER STRUCTURE AND FUNCTION' },
    { roman: 'III.', label: 'CALCIUM SCORING' },
  ],
  page2: {
    section1Title: 'Section I: CTA report:',
    ctaIntro: 'Right dominant coronary system.',
    ctaSubsections: [
      {
        heading: 'LEFT MAIN stem',
        lines: [
          'Normal posterior take off from left coronary cusp.',
          'Good Caliber and average length vessel without significant disease.',
          'It bifurcates at 90 degree angle into the Left Anterior Descending (LAD) and Left Circumflex (LCX) arteries.',
        ],
      },
      {
        heading: 'LAD artery',
        lines: ['Good caliber highly tortuous vessel, wrapping up the apex.', 'No significant disease..'],
      },
      {
        heading: 'Diagonal branches',
        lines: ['Good caliber vessel, No significant disease'],
      },
      {
        heading: 'LCX artery',
        lines: ['Good caliber non-dominant artery.', 'No significant disease.'],
      },
      {
        heading: 'Marginal vessels',
        lines: ['Good caliber vessel, No significant disease'],
      },
      {
        heading: 'RCA artery',
        lines: [
          'Dominant good caliber vessel.',
          'Normal anterior take off from right coronary cusp.',
          'No significant disease.',
          'It gives off SA-node, Right Ventricular, Posterior descending (PDA), and Posterior Lateral (PLA) branches.',
        ],
      },
      {
        heading: 'PDA',
        lines: ['No significant disease.'],
      },
      {
        heading: 'PLA',
        lines: ['No significant disease.'],
      },
    ],
    section2Title: 'Section II: Cardiac Chamber structure and function:',
    chamberLines: [
      'Normal left ventricular volumes and wall thickness.',
      'Normal left ventricular Ejection fraction',
      'No apparent right or left atrial abnormalities.',
      'No apparent right ventricular abnormalities.',
      'Normal aorta and main pulmonary vessels.',
      'Normal pericardium.',
    ],
    section3Title: 'Section III: Calcium scoring:',
    calciumLines: [
      'No coronary calcium burden identified. Findings are consistent with the conclusions above (no coronary calcium accumulation).',
    ],
  },
};

function cardiacFromLegacy(
  status: string,
  patientId: string,
  title: string,
  date: string,
  indication: string,
  technique: string,
  findings: string,
  impression: string
): CardiacCTReport {
  const parts = title.split(' — ');
  const study = parts[0] ?? title;
  return {
    bannerTitle: 'CARDIAC CT Report',
    status,
    patientName: patientId,
    sex: '—',
    age: '—',
    scanDate: date,
    indicationLabel: 'Indication for study',
    indication,
    techniques: [technique, 'See source system for full acquisition parameters.'],
    conclusions: [findings, impression].filter(Boolean),
    sectionsIntro: 'This report consists of three sections:',
    sectionsOutline: [
      { roman: 'I.', label: 'CT CORONARY ANGIOGRAPHY (CTA)' },
      { roman: 'II.', label: 'CARDIAC CHAMBER STRUCTURE AND FUNCTION' },
      { roman: 'III.', label: 'CALCIUM SCORING' },
    ],
    page2: {
      section1Title: 'Section I: CTA report:',
      ctaIntro: findings.split('.')[0] ? `${findings.split('.')[0]}.` : findings,
      ctaSubsections: [
        { heading: study.toUpperCase(), lines: [findings] },
        { heading: 'Summary', lines: [impression] },
      ],
      section2Title: 'Section II: Cardiac Chamber structure and function:',
      chamberLines: ['See Section I and clinical correlation.', 'Structured chamber analysis not applicable to this study type in demo data.'],
      section3Title: 'Section III: Calcium scoring:',
      calciumLines: ['Not separately reported for this demo study.'],
    },
  };
}

const MOCK_CARDIAC: Record<string, CardiacCTReport> = {
  '1': CARDIAC_CT_ICC_0206,
  '2': cardiacFromLegacy(
    'Draft',
    'ICC_Patient_0144',
    'MRI Brain — Maria G.',
    'Feb 28, 2025',
    'Chronic headaches; exclude structural lesion.',
    'Multiplanar multisequence MRI brain including T1, T2, FLAIR, and diffusion-weighted imaging without gadolinium.',
    'No mass effect. No midline shift. Parenchymal signal within normal limits.',
    'Normal brain MRI. Recommend clinical correlation.'
  ),
  '3': cardiacFromLegacy(
    'Final',
    'ICC_Patient_0291',
    'X-Ray Spine — Robert K.',
    'Feb 27, 2025',
    'Mechanical back pain after fall.',
    'AP and lateral radiographs of the lumbar spine.',
    'Alignment maintained. No fracture. Disc spaces preserved.',
    'No acute osseous disease.'
  ),
  '4': cardiacFromLegacy(
    'Final',
    'ICC_Patient_0103',
    'CT Abdomen — Sarah C.',
    'Feb 26, 2025',
    'Non-specific abdominal pain.',
    'Contrast-enhanced CT abdomen and pelvis with portal venous phase.',
    'Liver, spleen, kidneys unremarkable. No free fluid.',
    'Normal CT abdomen.'
  ),
  '5': cardiacFromLegacy(
    'Draft',
    'ICC_Patient_0338',
    'MRI Knee — James W.',
    'Feb 25, 2025',
    'Twisting injury with effusion.',
    'MRI left knee including PD and T2 FS sequences.',
    'ACL intact. Menisci without tear. No joint effusion.',
    'Normal MRI knee.'
  ),
  '6': cardiacFromLegacy(
    'Final',
    'ICC_Patient_0552',
    'X-Ray Hand — Emily D.',
    'Feb 24, 2025',
    'Trauma to right hand.',
    'AP, oblique, and lateral radiographs of the right hand.',
    'No fracture or dislocation. Soft tissues unremarkable.',
    'Normal hand X-ray.'
  ),
};

function reportToPlainText(r: CardiacCTReport): string {
  const lines = [
    r.bannerTitle,
    '',
    `Patient Name: ${r.patientName}`,
    `Sex: ${r.sex}`,
    `Age: ${r.age}`,
    `Scan Date: ${r.scanDate}`,
    `${r.indicationLabel}: ${r.indication}`,
    '',
    'Techniques:',
    ...r.techniques.map((p) => p),
    '',
    'CONCLUSIONS:',
    ...r.conclusions.map((c, i) => `${i + 1}. ${c}`),
    '',
    r.sectionsIntro,
    ...r.sectionsOutline.map((s) => `${s.roman} ${s.label}`),
    '',
    r.page2.section1Title,
    r.page2.ctaIntro,
    ...r.page2.ctaSubsections.flatMap((sub) => [`${sub.heading}:`, ...sub.lines.map((l) => `  ${l}`)]),
    '',
    r.page2.section2Title,
    ...r.page2.chamberLines.map((l) => `• ${l}`),
    '',
    r.page2.section3Title,
    ...r.page2.calciumLines.map((l) => `• ${l}`),
  ];
  return lines.join('\n');
}

function CardiacCTDocument({ report }: { report: CardiacCTReport }) {
  return (
    <article className="report-doc report-doc--cardiac-ct">
      <div className="report-cardiac-page">
        <h1 className="report-cardiac-title">{report.bannerTitle}</h1>

        <div className="report-cardiac-patient">
          <div className="report-cardiac-field">
            <span className="report-cardiac-label">Patient Name</span>
            <span className="report-cardiac-value">{report.patientName}</span>
          </div>
          <div className="report-cardiac-field">
            <span className="report-cardiac-label">Sex</span>
            <span className="report-cardiac-value">{report.sex}</span>
          </div>
          <div className="report-cardiac-field">
            <span className="report-cardiac-label">Age</span>
            <span className="report-cardiac-value">{report.age}</span>
          </div>
          <div className="report-cardiac-field">
            <span className="report-cardiac-label">Scan Date</span>
            <span className="report-cardiac-value">{report.scanDate}</span>
          </div>
          <div className="report-cardiac-field report-cardiac-field--indication">
            <span className="report-cardiac-label">{report.indicationLabel}</span>
            <span className="report-cardiac-value report-cardiac-value--indented">{report.indication}</span>
          </div>
        </div>

        <hr className="report-cardiac-rule" />

        <section className="report-cardiac-section">
          <h2 className="report-cardiac-section-title">Techniques:</h2>
          {report.techniques.map((para, i) => (
            <p key={i} className="report-cardiac-para">
              {para}
            </p>
          ))}
        </section>

        <section className="report-cardiac-section">
          <h2 className="report-cardiac-conclusions-heading">CONCLUSIONS:</h2>
          <ol className="report-cardiac-numbered">
            {report.conclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="report-cardiac-section report-cardiac-section--index">
          <p className="report-cardiac-para report-cardiac-para--no-indent">{report.sectionsIntro}</p>
          <ol className="report-cardiac-roman" type="I">
            {report.sectionsOutline.map((s) => (
              <li key={s.roman}>{s.label}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className="report-cardiac-page report-cardiac-page--2">
        <section className="report-cardiac-section">
          <h2 className="report-cardiac-major-heading">{report.page2.section1Title}</h2>
          <p className="report-cardiac-para report-cardiac-para--hanging">{report.page2.ctaIntro}</p>

          {report.page2.ctaSubsections.map((sub) => (
            <div key={sub.heading} className="report-cardiac-cta-block">
              <h3 className="report-cardiac-cta-sub">{sub.heading}:</h3>
              {sub.lines.map((line, j) => (
                <p key={`${sub.heading}-${j}`} className="report-cardiac-para report-cardiac-para--indented">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </section>

        <section className="report-cardiac-section report-cardiac-section--spaced">
          <h2 className="report-cardiac-major-heading">{report.page2.section2Title}</h2>
          <ul className="report-cardiac-bare-list">
            {report.page2.chamberLines.map((line, i) => (
              <li key={`ch-${i}`}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="report-cardiac-section">
          <h2 className="report-cardiac-major-heading">{report.page2.section3Title}</h2>
          <ul className="report-cardiac-bare-list">
            {report.page2.calciumLines.map((line, i) => (
              <li key={`ca-${i}`}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const report = id ? MOCK_CARDIAC[id] : null;
  const { addToast } = useToast();

  const handlePrint = () => window.print();

  const handleExportPdf = () => {
    addToast('success', 'Report exported as PDF');
  };

  const handleCopySummary = () => {
    if (!report) return;
    navigator.clipboard.writeText(reportToPlainText(report)).then(() => addToast('success', 'Report copied to clipboard'));
  };

  if (!report) {
    return (
      <div className="report-detail-page">
        <div className="card report-detail-card report-doc-shell report-doc-shell--cardiac">
          <p>Report not found.</p>
          <Link to="/app/reports" className="btn btn-primary">Back to reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="report-detail-page">
      <motion.div
        className="report-detail-card card report-doc-shell report-doc-shell--cardiac"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="report-detail-header report-doc-no-print">
          <Link to="/app/reports" className="report-detail-back">
            <ArrowLeft size={18} />
            Back to reports
          </Link>
          <div className="report-detail-actions">
            <span className={`report-detail-status report-detail-status--${report.status.toLowerCase()}`}>{report.status}</span>
            <button type="button" className="btn btn-ghost" onClick={handlePrint}>
              <Printer size={18} />
              Print
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleCopySummary}>
              <Copy size={18} />
              Copy report
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportPdf}>
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <CardiacCTDocument report={report} />
      </motion.div>
    </div>
  );
}

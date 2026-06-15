export type Subject = 'physics' | 'chemistry' | 'biology';

export interface Question {
  id: string;
  subject: Subject;
  exam: 'NEET' | 'JEE' | 'both';
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
}

export const QUESTIONS: Question[] = [
  // ============ PHYSICS (20) ============
  { id: 'p1', subject: 'physics', exam: 'both', question: 'SI unit of electric field is:', options: ['N/C', 'C/N', 'J/C', 'V·m'], correctIndex: 0 },
  { id: 'p2', subject: 'physics', exam: 'both', question: 'A body in uniform circular motion has constant:', options: ['Velocity', 'Acceleration', 'Speed', 'Momentum'], correctIndex: 2 },
  { id: 'p3', subject: 'physics', exam: 'both', question: 'Dimensional formula of work is:', options: ['[MLT⁻¹]', '[ML²T⁻²]', '[MLT⁻²]', '[ML²T⁻¹]'], correctIndex: 1 },
  { id: 'p4', subject: 'physics', exam: 'NEET', question: 'Escape velocity from Earth (approx) is:', options: ['7.9 km/s', '11.2 km/s', '15.0 km/s', '9.8 km/s'], correctIndex: 1 },
  { id: 'p5', subject: 'physics', exam: 'JEE', question: 'In Young\'s double slit, fringe width is proportional to:', options: ['1/λ', 'λ', 'λ²', '1/λ²'], correctIndex: 1 },
  { id: 'p6', subject: 'physics', exam: 'both', question: 'Bohr radius of hydrogen atom is approx:', options: ['0.053 nm', '0.53 nm', '5.3 nm', '53 nm'], correctIndex: 0 },
  { id: 'p7', subject: 'physics', exam: 'both', question: 'Resistance of an ideal ammeter is:', options: ['Infinite', 'Very high', 'Zero', 'Equal to load'], correctIndex: 2 },
  { id: 'p8', subject: 'physics', exam: 'both', question: 'Lens formula is:', options: ['1/v − 1/u = 1/f', '1/v + 1/u = 1/f', 'v − u = f', 'v/u = f'], correctIndex: 0 },
  { id: 'p9', subject: 'physics', exam: 'NEET', question: 'Photoelectric effect was explained by:', options: ['Newton', 'Einstein', 'Planck', 'Bohr'], correctIndex: 1 },
  { id: 'p10', subject: 'physics', exam: 'both', question: 'A particle moves with v = 2t² m/s. Acceleration at t=2s is:', options: ['4 m/s²', '8 m/s²', '2 m/s²', '16 m/s²'], correctIndex: 1 },
  { id: 'p11', subject: 'physics', exam: 'JEE', question: 'Capacitance of parallel plate capacitor depends on:', options: ['Charge', 'Voltage', 'Plate area & separation', 'Current'], correctIndex: 2 },
  { id: 'p12', subject: 'physics', exam: 'both', question: 'First law of thermodynamics is conservation of:', options: ['Momentum', 'Mass', 'Energy', 'Charge'], correctIndex: 2 },
  { id: 'p13', subject: 'physics', exam: 'both', question: 'Sound waves in air are:', options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'Stationary'], correctIndex: 1 },
  { id: 'p14', subject: 'physics', exam: 'JEE', question: 'Magnetic field inside a long solenoid is:', options: ['μ₀nI', 'μ₀I/2πr', 'μ₀NI/L²', 'Zero'], correctIndex: 0 },
  { id: 'p15', subject: 'physics', exam: 'NEET', question: 'Refractive index of vacuum is:', options: ['0', '1', '1.33', '1.5'], correctIndex: 1 },
  { id: 'p16', subject: 'physics', exam: 'both', question: 'Kinetic energy of a body of mass 2 kg moving at 3 m/s is:', options: ['6 J', '9 J', '18 J', '12 J'], correctIndex: 1 },
  { id: 'p17', subject: 'physics', exam: 'both', question: 'Unit of magnetic flux is:', options: ['Tesla', 'Weber', 'Henry', 'Gauss'], correctIndex: 1 },
  { id: 'p18', subject: 'physics', exam: 'JEE', question: 'In SHM, at mean position the body has maximum:', options: ['PE', 'Displacement', 'KE', 'Acceleration'], correctIndex: 2 },
  { id: 'p19', subject: 'physics', exam: 'both', question: 'Power of a lens of focal length 50 cm is:', options: ['0.5 D', '2 D', '50 D', '5 D'], correctIndex: 1 },
  { id: 'p20', subject: 'physics', exam: 'NEET', question: 'Radioactive decay follows which order kinetics?', options: ['Zero', 'First', 'Second', 'Pseudo'], correctIndex: 1 },

  // ============ CHEMISTRY (20) ============
  { id: 'c1', subject: 'chemistry', exam: 'both', question: 'pH of pure water at 25°C is:', options: ['0', '7', '14', '1'], correctIndex: 1 },
  { id: 'c2', subject: 'chemistry', exam: 'both', question: 'Number of moles in 22 g of CO₂ is:', options: ['0.25', '0.5', '1', '2'], correctIndex: 1 },
  { id: 'c3', subject: 'chemistry', exam: 'both', question: 'Bond angle in methane (CH₄) is:', options: ['90°', '104.5°', '109.5°', '120°'], correctIndex: 2 },
  { id: 'c4', subject: 'chemistry', exam: 'NEET', question: 'Which is the most electronegative element?', options: ['O', 'F', 'Cl', 'N'], correctIndex: 1 },
  { id: 'c5', subject: 'chemistry', exam: 'JEE', question: 'Hybridization of carbon in ethylene (C₂H₄) is:', options: ['sp', 'sp²', 'sp³', 'sp³d'], correctIndex: 1 },
  { id: 'c6', subject: 'chemistry', exam: 'both', question: 'Avogadro number is:', options: ['6.022×10²³', '1.6×10⁻¹⁹', '9.1×10⁻³¹', '3.0×10⁸'], correctIndex: 0 },
  { id: 'c7', subject: 'chemistry', exam: 'both', question: 'IUPAC name of CH₃-CH₂-OH is:', options: ['Methanol', 'Ethanol', 'Propanol', 'Ethanal'], correctIndex: 1 },
  { id: 'c8', subject: 'chemistry', exam: 'both', question: 'Oxidation state of S in H₂SO₄ is:', options: ['+2', '+4', '+6', '−2'], correctIndex: 2 },
  { id: 'c9', subject: 'chemistry', exam: 'JEE', question: 'Which has highest first ionization energy?', options: ['Na', 'Mg', 'Al', 'Si'], correctIndex: 1 },
  { id: 'c10', subject: 'chemistry', exam: 'NEET', question: 'Markovnikov\'s rule applies to:', options: ['Substitution', 'Elimination', 'Addition to alkenes', 'Oxidation'], correctIndex: 2 },
  { id: 'c11', subject: 'chemistry', exam: 'both', question: 'Which gas is liberated when zinc reacts with dilute HCl?', options: ['O₂', 'Cl₂', 'H₂', 'CO₂'], correctIndex: 2 },
  { id: 'c12', subject: 'chemistry', exam: 'both', question: 'Number of atoms in a body-centered cubic unit cell:', options: ['1', '2', '4', '6'], correctIndex: 1 },
  { id: 'c13', subject: 'chemistry', exam: 'JEE', question: 'ΔG = 0 implies the reaction is at:', options: ['Forward bias', 'Equilibrium', 'Reverse bias', 'Spontaneous'], correctIndex: 1 },
  { id: 'c14', subject: 'chemistry', exam: 'both', question: 'General formula of alkynes is:', options: ['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙH₂ₙ₋₂', 'CₙHₙ'], correctIndex: 2 },
  { id: 'c15', subject: 'chemistry', exam: 'NEET', question: 'Vitamin C is chemically:', options: ['Citric acid', 'Ascorbic acid', 'Acetic acid', 'Folic acid'], correctIndex: 1 },
  { id: 'c16', subject: 'chemistry', exam: 'both', question: 'Lewis acid is:', options: ['Electron pair donor', 'Electron pair acceptor', 'Proton donor', 'Proton acceptor'], correctIndex: 1 },
  { id: 'c17', subject: 'chemistry', exam: 'both', question: 'Anode in electrolysis is:', options: ['Negative electrode', 'Positive electrode', 'Neutral', 'Salt bridge'], correctIndex: 1 },
  { id: 'c18', subject: 'chemistry', exam: 'JEE', question: 'Colligative property depends on:', options: ['Nature of solute', 'Mass of solute', 'Number of particles', 'Volume of solvent'], correctIndex: 2 },
  { id: 'c19', subject: 'chemistry', exam: 'both', question: 'Boyle\'s law: at constant T,', options: ['PV = const', 'V/T = const', 'P/T = const', 'PT = const'], correctIndex: 0 },
  { id: 'c20', subject: 'chemistry', exam: 'NEET', question: 'Functional group of aldehyde is:', options: ['-COOH', '-CHO', '-OH', '-NH₂'], correctIndex: 1 },

  // ============ BIOLOGY (20) ============
  { id: 'b1', subject: 'biology', exam: 'NEET', question: 'Powerhouse of the cell is:', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'], correctIndex: 2 },
  { id: 'b2', subject: 'biology', exam: 'NEET', question: 'Number of chromosomes in human somatic cells:', options: ['23', '46', '48', '44'], correctIndex: 1 },
  { id: 'b3', subject: 'biology', exam: 'NEET', question: 'Photosynthesis occurs in:', options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Vacuole'], correctIndex: 1 },
  { id: 'b4', subject: 'biology', exam: 'NEET', question: 'Universal blood donor group:', options: ['A', 'B', 'AB', 'O-negative'], correctIndex: 3 },
  { id: 'b5', subject: 'biology', exam: 'NEET', question: 'Father of genetics is:', options: ['Darwin', 'Mendel', 'Watson', 'Lamarck'], correctIndex: 1 },
  { id: 'b6', subject: 'biology', exam: 'NEET', question: 'Functional unit of kidney is:', options: ['Neuron', 'Nephron', 'Alveoli', 'Villi'], correctIndex: 1 },
  { id: 'b7', subject: 'biology', exam: 'NEET', question: 'DNA replication is:', options: ['Conservative', 'Semi-conservative', 'Dispersive', 'Random'], correctIndex: 1 },
  { id: 'b8', subject: 'biology', exam: 'NEET', question: 'Largest gland in human body:', options: ['Pancreas', 'Liver', 'Thyroid', 'Adrenal'], correctIndex: 1 },
  { id: 'b9', subject: 'biology', exam: 'NEET', question: 'ATP is produced mainly in:', options: ['Cytoplasm', 'Mitochondria', 'Nucleus', 'Lysosome'], correctIndex: 1 },
  { id: 'b10', subject: 'biology', exam: 'NEET', question: 'Number of cranial nerves in humans:', options: ['10', '12', '14', '31'], correctIndex: 1 },
  { id: 'b11', subject: 'biology', exam: 'NEET', question: 'Site of protein synthesis:', options: ['Nucleus', 'Ribosome', 'ER', 'Mitochondria'], correctIndex: 1 },
  { id: 'b12', subject: 'biology', exam: 'NEET', question: 'Insulin is secreted by:', options: ['Alpha cells', 'Beta cells', 'Delta cells', 'Acinar cells'], correctIndex: 1 },
  { id: 'b13', subject: 'biology', exam: 'NEET', question: 'Process by which plants lose water:', options: ['Respiration', 'Transpiration', 'Translocation', 'Guttation'], correctIndex: 1 },
  { id: 'b14', subject: 'biology', exam: 'NEET', question: 'Genetic material of HIV is:', options: ['DNA', 'Single-stranded RNA', 'Double-stranded RNA', 'Protein'], correctIndex: 1 },
  { id: 'b15', subject: 'biology', exam: 'NEET', question: 'Krebs cycle takes place in:', options: ['Cytoplasm', 'Matrix of mitochondria', 'Chloroplast', 'Nucleus'], correctIndex: 1 },
  { id: 'b16', subject: 'biology', exam: 'NEET', question: 'Smallest bone in human body:', options: ['Stapes', 'Malleus', 'Incus', 'Phalanx'], correctIndex: 0 },
  { id: 'b17', subject: 'biology', exam: 'NEET', question: 'Blood pH (normal) is around:', options: ['6.4', '7.4', '8.4', '5.4'], correctIndex: 1 },
  { id: 'b18', subject: 'biology', exam: 'NEET', question: 'Which is a sex-linked disorder?', options: ['Down syndrome', 'Hemophilia', 'Diabetes', 'Sickle cell'], correctIndex: 1 },
  { id: 'b19', subject: 'biology', exam: 'NEET', question: 'Calvin cycle occurs in:', options: ['Grana', 'Stroma', 'Thylakoid', 'Cytoplasm'], correctIndex: 1 },
  { id: 'b20', subject: 'biology', exam: 'NEET', question: 'Hormone that regulates blood calcium:', options: ['Insulin', 'Parathyroid hormone', 'Adrenaline', 'Thyroxine'], correctIndex: 1 },
];

export function pickQuizQuestions(perSubject = 5): Question[] {
  const subjects: Subject[] = ['physics', 'chemistry', 'biology'];
  const picked: Question[] = [];
  for (const s of subjects) {
    const pool = QUESTIONS.filter(q => q.subject === s);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    picked.push(...shuffled.slice(0, perSubject));
  }
  return picked;
}

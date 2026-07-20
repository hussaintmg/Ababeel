// app/data/professional-dev-categories.js
import { 
  FaGraduationCap, 
  FaChartLine, 
  FaLaptopHouse, 
  FaUsers, 
  FaTools 
} from "react-icons/fa";
import { webData } from "@/constants";

export const professionalDevCategories = [
  {
    id: "cpd",
    title: "Continuing Professional Development (CPD)",
    icon: FaGraduationCap,
    tagline: "Your pathway to professional growth and success",
    description: "Continuing Professional Development (CPD) refers to any learning or certification that enhances and expands your knowledge, skills, and professional capabilities.",
    content: `It's important to keep a record of your CPD activities, as you may need to provide this when applying for ${webData.brand.name} membership. Make sure your hard work counts by documenting your progress!

Why CPD Matters for You:
• Develop New Skills: Expanding your knowledge and abilities is key to advancing in your career.
• Boost Your Employability: Staying updated with industry trends gives you a competitive edge. CPD also shows your commitment to self-improvement, making you a more appealing candidate to employers and clients.
• Increase Your Confidence: Strengthening your expertise enhances your job performance, job satisfaction, and opens the door to new opportunities.`,
    programs: [
      "Our Professional Standards",
      `Flexible Learning Solutions at ${webData.brand.name}`,
      "Networking Opportunities",
      "Skill Enhancement"
    ]
  },
  {
    id: "professional-standards",
    title: "Our Professional Standards",
    icon: FaChartLine,
    tagline: "Setting the benchmark for excellence",
    description: `The ${webData.brand.name} Professional Standards establish a comprehensive guideline that delineates the essential skills, knowledge, and responsibilities required of Environmental Health Practitioners (EHPs) committed to fostering safer, cleaner, and healthier environments.`,
    content: `These standards serve as a structured guideline, ensuring professional excellence and public protection across various sectors.

Key Principles and Objectives:

Competency Framework:
• Defines the technical expertise, regulatory knowledge, and practical competencies expected from professionals in environmental health.
• Ensures alignment with best practices, legislative requirements, and scientific advancements in the field.

Professional Conduct and Ethics:
• Outlines the commitments and ethical responsibilities that practitioners must uphold to maintain integrity, accountability, and public trust.
• Promotes a culture of transparency, evidence-based decision-making, and continuous professional development.

Quality Assurance in Certification and Certification:
• Establishes high standards for certification programs and certification processes, ensuring consistency in professional qualifications.
• Encourages external audits, peer reviews, and compliance assessments to maintain the credibility of environmental health credentials.

Sector-Wide Impact and Career Development:
• Provides a clear career progression pathway, ensuring that professionals can advance through structured learning, skill enhancement, and specialization.
• Encourages interdisciplinary collaboration and knowledge exchange, fostering innovation in public health and environmental protection.

The ${webData.brand.name} Professional Standards elevate the status and credibility of Environmental Health Practitioners, ensuring their work consistently meets the highest professional and ethical standards. These guidelines not only safeguard public well-being but also enhance the global recognition and advancement of the profession.`,
    programs: [
      "Continuing Professional Development (CPD)",
      `Flexible Learning Solutions at ${webData.brand.name}`,
      "Networking Opportunities",
      "Skill Enhancement"
    ]
  },
  {
    id: "flexible-learning",
    title: `Flexible Learning Solutions at ${webData.brand.name}`,
    icon: FaLaptopHouse,
    tagline: "Learn at your own pace, on your own terms",
    description: `At ${webData.brand.name}, we recognize that each professional has distinct learning needs and time constraints. To support career growth and organizational development, we offer a suite of flexible learning options.`,
    content: `Our Learning Solutions Include:

Self-Paced Online Courses: Gain 24/7 access to interactive certification materials, assessments, and certification at your own pace, providing flexibility for busy professionals.

Blended Learning: A combination of online learning and practical sessions that ensures a comprehensive, hands-on educational experience.

On-Demand Corporate Certification: Customizable courses tailored to meet the specific needs of your organization, available at any time for maximum convenience.

Work-Based Learning: Practical certification integrated into the workplace, allowing learners to develop skills through real-world scenarios without disrupting day-to-day operations.

At ${webData.brand.name}, we are committed to delivering flexible, accessible, and industry-leading certification solutions that foster career advancement and organizational excellence. Our approach is designed to equip individuals and businesses with the skills necessary to succeed in today's dynamic professional landscape.`,
    programs: [
      "Continuing Professional Development (CPD)",
      "Our Professional Standards",
      "Networking Opportunities",
      "Skill Enhancement"
    ]
  },
  {
    id: "networking-opportunities",
    title: "Networking Opportunities",
    icon: FaUsers,
    tagline: "Connect, collaborate, and grow together",
    description: `At ${webData.brand.name}, we recognize that professional growth extends beyond traditional certification. Our Networking Opportunities are strategically designed to enable learners to connect with industry leaders, peers, and mentors.`,
    content: `Through exclusive networking events, industry conferences, and webinars, participants gain direct access to key decision-makers, enrich their industry knowledge, and explore new career prospects. These initiatives create a platform for collaboration and ensure that professionals remain at the forefront of industry developments.

In addition, our Alumni Network and online platforms offer continuous engagement, allowing professionals to maintain and expand their connections throughout their careers. These resources provide valuable opportunities for ongoing knowledge exchange, professional development, and the sharing of industry best practices.

At ${webData.brand.name}, we are committed to providing the necessary tools and opportunities to help our learners build a robust professional network that enhances their career trajectory and contributes to organizational success.`,
    programs: [
      "Continuing Professional Development (CPD)",
      "Our Professional Standards",
      `Flexible Learning Solutions at ${webData.brand.name}`,
      "Skill Enhancement"
    ]
  },
  {
    id: "skill-enhancement",
    title: "Skill Enhancement",
    icon: FaTools,
    tagline: "Sharpen your skills for tomorrow's challenges",
    description: `At ${webData.brand.name}, we are dedicated to advancing professional development through meticulously designed Skill Enhancement programs tailored to the unique needs of individuals and organizations.`,
    content: `Our extensive offerings include technical skills development, leadership certification, industry-specific certifications, and soft skills enhancement, all crafted to empower professionals with the critical competencies required to excel in their careers. With flexible delivery methods such as online, blended, and on-site formats, we ensure our certification solutions are accessible and adaptable to a variety of schedules and learning preferences.

Our team of expert trainers provides valuable, real-world insights, enabling learners to effectively apply their new skills in the workplace, thus enhancing performance and driving sustainable career growth. Whether you aim to refine your existing skill set or expand your expertise, ${webData.brand.name} equips you with the resources needed to reach your professional objectives.`,
    programs: [
      "Our Professional Standards",
      `Flexible Learning Solutions at ${webData.brand.name}`,
      "Networking Opportunities",
      "Continuing Professional Development (CPD)"
    ]
  }
];
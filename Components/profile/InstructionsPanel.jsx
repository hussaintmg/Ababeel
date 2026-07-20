import { Check } from "lucide-react";

export default function InstructionsPanel({ activeTab }) {
  const instructions = {
    account: {
      title: "Password Requirements",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      titleColor: "text-blue-900",
      items: [
        "Minimum 8 characters",
        "Include uppercase and lowercase letters",
        "Include at least one number",
        "Include special characters (@$!%*?&) for better security",
      ],
    },
    signature: {
      title: "Image Guidelines",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      titleColor: "text-green-900",
      items: [
        "Only PNG format accepted",
        "Use transparent background",
        "Maximum file size: 5MB",
        "Signature should be clear and readable",
      ],
    },
    personal: {
      title: "Information Guidelines",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      titleColor: "text-purple-900",
      items: [
        "Provide accurate contact information",
        "Use correct country code for phone number",
        "Enter complete address including city and postal code",
        "All fields are required for verification",
      ],
    },
    atc: {
      title: "ATC Details Guidelines",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800",
      titleColor: "text-amber-900",
      items: [
        "ATC name must match official registration",
        "ATC number should be valid and registered",
        "Provide complete address including city and country",
        "All fields are mandatory for tax documentation",
        "Ensure information is accurate and up-to-date",
      ],
    },
  };

  const current = instructions[activeTab];

  return (
    <div
      className={`${current.bgColor} border ${current.borderColor} rounded-xl p-4 md:p-6`}
    >
      <h3 className={`text-lg font-semibold ${current.titleColor} mb-3`}>
        {current.title}
      </h3>
      <ul className="space-y-2">
        {current.items.map((item, index) => (
          <li key={index} className="flex items-start">
            <Check
              className={`w-5 h-5 mr-2 mt-0.5 shrink-0 ${current.textColor}`}
            />
            <span className={`text-sm md:text-base ${current.textColor}`}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The ABA Safety design system.
 *
 * Import from here rather than from the individual files, so a component can be
 * split or renamed without touching every page that uses it.
 *
 * Everything is responsive, keyboard-operable and safe with missing CMS data —
 * see the notes in each file for what that means in practice.
 */
export { cn } from "@/Components/ui/cn";

export { Button, LinkButton, InertButton } from "@/Components/ui/Button";

export {
  Container,
  Section,
  SectionHeading,
  Badge,
  LevelBadge,
  Card,
  ImageWell,
  LogoTile,
  Breadcrumb,
  EmptyState,
  NoResults,
  ErrorState,
  Skeleton,
  CourseCardSkeleton,
  CardGridSkeleton,
  ScheduleSkeleton,
  DetailSkeleton,
  LoadingAnnouncer,
} from "@/Components/ui/Primitives";

export {
  Drawer,
  Modal,
  Tabs,
  Accordion,
  Pagination,
  SearchInput,
  FilterGroup,
  FilterTrigger,
  Select,
} from "@/Components/ui/Interactive";

export {
  Field,
  TextInput,
  TextArea,
  SelectField,
  RadioGroup,
  Checkbox,
  DateField,
  FileField,
} from "@/Components/ui/Field";

export { Reveal, RevealStagger } from "@/Components/ui/Reveal";

export { CourseCard, CARD_TEMPLATES } from "@/Components/ui/CourseCard";

export {
  AwardingBodyCard,
  SessionCard,
  TestimonialCard,
  PersonCard,
} from "@/Components/ui/DomainCards";

export { ConsultantProfile } from "@/Components/ui/ConsultantProfile";

export { ResourceCard, resourceAction } from "@/Components/ui/ResourceCard";

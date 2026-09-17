/**
 * Model barrel.
 *
 * Importing this file registers every Mongoose model with the shared
 * connection, which is what makes automatic CMS schema discovery possible:
 * `lib/cms/schemaRegistry` walks `mongoose.models` after importing this.
 *
 * ⚠ Add every new file in `models/` here — `__tests__/cms/schemaRegistry.test.js`
 * fails if a model file is missing from this list.
 */
import ActivationToken from "@/models/ActivationToken";
import AuditLog from "@/models/AuditLog";
import AwardingBody from "@/models/AwardingBody";
import Candidate from "@/models/Candidate";
import CmsCustomSection from "@/models/CmsCustomSection";
import CmsDataSource from "@/models/CmsDataSource";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import CmsRegistryState from "@/models/CmsRegistryState";
import CmsVariable from "@/models/CmsVariable";
import Consultant from "@/models/Consultant";
import Contact from "@/models/Contact";
import Course from "@/models/Course";
import CourseLevel from "@/models/CourseLevel";
import CourseReference from "@/models/CourseReference";
import Notification from "@/models/Notification";
import Registration from "@/models/Registration";
import RegistrationField from "@/models/RegistrationField";
import Resource from "@/models/Resource";
import SiteContent from "@/models/SiteContent";
import TeamMember from "@/models/TeamMember";
import Template from "@/models/Template";
import Testimonial from "@/models/Testimonial";
import User from "@/models/User";

export {
  ActivationToken,
  AuditLog,
  AwardingBody,
  Candidate,
  CmsCustomSection,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Consultant,
  Contact,
  Course,
  CourseLevel,
  CourseReference,
  Notification,
  Registration,
  RegistrationField,
  Resource,
  SiteContent,
  TeamMember,
  Template,
  Testimonial,
  User,
};

export const ALL_MODELS = {
  ActivationToken,
  AuditLog,
  AwardingBody,
  Candidate,
  CmsCustomSection,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Consultant,
  Contact,
  Course,
  CourseLevel,
  CourseReference,
  Notification,
  Registration,
  RegistrationField,
  Resource,
  SiteContent,
  TeamMember,
  Template,
  Testimonial,
  User,
};

export default ALL_MODELS;


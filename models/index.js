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
import Accreditation from "@/models/Accreditation";
import ActivationToken from "@/models/ActivationToken";
import AuditLog from "@/models/AuditLog";
import AwardingBody from "@/models/AwardingBody";
import Candidate from "@/models/Candidate";
import CmsDataSource from "@/models/CmsDataSource";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import CmsRegistryState from "@/models/CmsRegistryState";
import CmsVariable from "@/models/CmsVariable";
import Consultant from "@/models/Consultant";
import Contact from "@/models/Contact";
import Course from "@/models/Course";
import CourseLevel from "@/models/CourseLevel";
import CourseReference from "@/models/CourseReference";
import CourseReferenceSession from "@/models/CourseReferenceSession";
import DefaultCourse from "@/models/DefaultCourse";
import DefaultCourseCopy from "@/models/DefaultCourseCopy";
import Deposit from "@/models/Deposit";
import Invoice from "@/models/Invoice";
import Notification from "@/models/Notification";
import Registration from "@/models/Registration";
import RegistrationField from "@/models/RegistrationField";
import Resource from "@/models/Resource";
import SiteContent from "@/models/SiteContent";
import TeamMember from "@/models/TeamMember";
import Template from "@/models/Template";
import Testimonial from "@/models/Testimonial";
import TrainingCourse from "@/models/TrainingCourse";
import User from "@/models/User";

export {
  Accreditation,
  ActivationToken,
  AuditLog,
  AwardingBody,
  Candidate,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Consultant,
  Contact,
  Course,
  CourseLevel,
  CourseReference,
  CourseReferenceSession,
  DefaultCourse,
  DefaultCourseCopy,
  Deposit,
  Invoice,
  Notification,
  Registration,
  RegistrationField,
  Resource,
  SiteContent,
  TeamMember,
  Template,
  Testimonial,
  TrainingCourse,
  User,
};

export const ALL_MODELS = {
  Accreditation,
  ActivationToken,
  AuditLog,
  AwardingBody,
  Candidate,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Consultant,
  Contact,
  Course,
  CourseLevel,
  CourseReference,
  CourseReferenceSession,
  DefaultCourse,
  DefaultCourseCopy,
  Deposit,
  Invoice,
  Notification,
  Registration,
  RegistrationField,
  Resource,
  SiteContent,
  TeamMember,
  Template,
  Testimonial,
  TrainingCourse,
  User,
};

export default ALL_MODELS;

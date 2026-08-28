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
import Candidate from "@/models/Candidate";
import CmsDataSource from "@/models/CmsDataSource";
import CmsFrameSequence from "@/models/CmsFrameSequence";
import CmsRegistryState from "@/models/CmsRegistryState";
import CmsVariable from "@/models/CmsVariable";
import Contact from "@/models/Contact";
import Course from "@/models/Course";
import CourseReference from "@/models/CourseReference";
import DefaultCourse from "@/models/DefaultCourse";
import DefaultCourseCopy from "@/models/DefaultCourseCopy";
import Deposit from "@/models/Deposit";
import Invoice from "@/models/Invoice";
import Notification from "@/models/Notification";
import SiteContent from "@/models/SiteContent";
import Template from "@/models/Template";
import User from "@/models/User";

export {
  ActivationToken,
  AuditLog,
  Candidate,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Contact,
  Course,
  CourseReference,
  DefaultCourse,
  DefaultCourseCopy,
  Deposit,
  Invoice,
  Notification,
  SiteContent,
  Template,
  User,
};

export const ALL_MODELS = {
  ActivationToken,
  AuditLog,
  Candidate,
  CmsDataSource,
  CmsFrameSequence,
  CmsRegistryState,
  CmsVariable,
  Contact,
  Course,
  CourseReference,
  DefaultCourse,
  DefaultCourseCopy,
  Deposit,
  Invoice,
  Notification,
  SiteContent,
  Template,
  User,
};

export default ALL_MODELS;

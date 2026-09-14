// Server-only adapter for the original public layouts. Reuses publication policy.
import {
  listPublicCourses, getCourseFilterOptions, getScheduleForMonth, getScheduleMonths,
  listAwardingBodies, listTeamMembers, listConsultants, listAccreditations,
  listPublicResources, getResourceTypes, getPublicCourseById, getPublicSessionById,
  getPublicCourseBySlug, getCourseSessions, getRelatedCourses, getAwardingBodyBySlug,
  getCoursesForAwardingBody, getResourceBySlug, getRelatedResources,
} from '@/lib/training/queries';
import { getTrainingSettings, getRegistrationPanel, getPaymentInfo } from '@/lib/training/settings';
import { getFormFields, toPublicField } from '@/lib/training/registrationForm';
import { publicBlockPage } from '@/Components/cms/publicPages/catalog';
import { resolveCertificate } from '@/lib/training/certificate';
import { RESOURCE_TYPE_LABELS } from '@/lib/training/constants';

export async function loadPublicSectionData(key, params = {}) {
  switch (key) {
    case 'course-detail': {
      const course = params.slug ? await getPublicCourseBySlug(params.slug) : (await listPublicCourses({ limit: 1 })).items[0];
      if (!course) return {};
      const [sessions, related, training] = await Promise.all([getCourseSessions(course._id, { limit: 8 }), getRelatedCourses(course, 3), getTrainingSettings()]);
      return { course, sessions, related, training, certificate: resolveCertificate(course, training), body: course.awardingBody || null, level: course.level || null, firstOpen: sessions.find(s => s.status === 'open') || null };
    }
    case 'awarding-body-detail': {
      const body = params.slug ? await getAwardingBodyBySlug(params.slug) : (await listAwardingBodies())[0];
      if (!body) return {};
      const [courses, training] = await Promise.all([getCoursesForAwardingBody(body._id), getTrainingSettings()]);
      return { body, courses, training };
    }
    case 'resource-detail': {
      const resource = params.slug ? await getResourceBySlug(params.slug) : (await listPublicResources({ limit: 1 })).items[0];
      if (!resource) return {};
      return { resource, related: await getRelatedResources(resource, 3), typeLabel: RESOURCE_TYPE_LABELS[resource.type] || 'Resource' };
    }
    case 'courses': {
      const [training, initial, filters] = await Promise.all([getTrainingSettings(), listPublicCourses({ limit: 12 }), getCourseFilterOptions()]);
      return { training, initial, filters, perPage: Number(training?.coursesPerPage) || 12 };
    }
    case 'schedule': {
      const now = new Date(), year = now.getUTCFullYear(), month = now.getUTCMonth() + 1;
      const [sessions, months, bodies, training] = await Promise.all([getScheduleForMonth({ year, month }), getScheduleMonths(), listAwardingBodies(), getTrainingSettings()]);
      return { year, month, sessions, months, bodies, copy: training?.schedule || {} };
    }
    case 'registration': {
      const courseId = typeof params.course === 'string' ? params.course : '';
      const sessionId = typeof params.reference === 'string' ? params.reference : '';
      const [course, session, coursesList, fields, panel, training, payment] = await Promise.all([
        courseId ? getPublicCourseById(courseId) : null, sessionId ? getPublicSessionById(sessionId) : null,
        listPublicCourses({ limit: 100 }), getFormFields(), getRegistrationPanel(), getTrainingSettings(), getPaymentInfo(),
      ]);
      return { course, session, coursesList, fields: fields.map(toPublicField), panel, payment, copy: training?.registration || {} };
    }
    case 'resources': {
      const [initial, types] = await Promise.all([listPublicResources({ limit: 12 }), getResourceTypes()]);
      return { initial, types, featured: initial.items.length > 3 ? initial.items.find(r => r.featured) || null : null };
    }
    case 'awarding-bodies': return { bodies: await listAwardingBodies() };
    case 'our-team': {
      const members = await listTeamMembers();
      return { members, leadership: members.filter(m => m.leadership), rest: members.filter(m => !m.leadership) };
    }
    case 'our-consultants': return { consultants: await listConsultants() };
    case 'accreditations': {
      const [accreditations, bodies] = await Promise.all([listAccreditations(), listAwardingBodies()]);
      return { accreditations, bodies };
    }
    default: return {};
  }
}

export async function injectPublicSectionData(blocks, params = {}) {
  const pending = new Map();
  async function visit(list) {
    return Promise.all((list || []).map(async block => {
      const key = publicBlockPage(block.type);
      let next = block;
      if (key) {
        const routeParams = block.props?.recordSlug ? { ...params, slug: block.props.recordSlug } : params;
        const cacheKey = `${key}:${routeParams.slug || ''}`;
        if (!pending.has(cacheKey)) pending.set(cacheKey, loadPublicSectionData(key, routeParams));
        // Never trust a saved _data payload: load published records on the server.
        next = { ...block, props: { ...block.props, _data: await pending.get(cacheKey) } };
      }
      if (Array.isArray(next.props?.children)) next = { ...next, props: { ...next.props, children: await visit(next.props.children) } };
      return next;
    }));
  }
  return visit(blocks);
}

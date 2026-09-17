import mongoose from 'mongoose';
import { PUBLIC_FIELD_ALLOWLIST } from './fieldPolicy';
import { PUBLIC_SESSION_STATUSES } from '@/lib/training/constants';
export function isPublicModel(name) { return name !== 'User' && Object.hasOwn(PUBLIC_FIELD_ALLOWLIST,name); }
export function publicRecordFilter(name) {
 if (!isPublicModel(name)) return {};
 const paths=mongoose.models[name]?.schema?.paths||{};
 const filter={};
 if(paths.status) filter.status={$in:['CourseReference','CourseReferenceSession'].includes(name)?PUBLIC_SESSION_STATUSES:['published','active']};
 if(paths.isPublished) filter.isPublished=true;
 return filter;
}

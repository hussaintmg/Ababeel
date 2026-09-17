import mongoose from 'mongoose';
import connectDB from '@/utils/db';
import CourseReference from '@/models/CourseReference';
import CourseReferenceSession from '@/models/CourseReferenceSession';
import TrainingCourse from '@/models/TrainingCourse';
import DefaultCourse from '@/models/DefaultCourse';
import { PUBLISHED, SCHEDULED_SESSION, isCoursePublic, isSessionPublic, isRegistrationOpen, registrationHref } from './status';
import { sanitizeDocument } from '@/lib/cms/fieldPolicy';
function plain(value) { return JSON.parse(JSON.stringify(value)); }
export function normalizePublicSession(row, course, sourceType, now=new Date()) {
 if(!row || row.showInSchedule!==true || !isSessionPublic(row) || !isCoursePublic(course)) return null;
 const safeCourse=sanitizeDocument(sourceType==='CourseReference'?'DefaultCourse':'TrainingCourse',plain(course));
 const price=sourceType==='CourseReference' ? (typeof row.coursePrice==='number'?row.coursePrice:null) : (typeof course.price==='number'?course.price:null);
 const result={_id:String(row._id),id:String(row._id),sourceType,course:safeCourse,courseId:String(course._id),courseName:course.name||course.courseName||'',courseSlug:course.slug||'',referenceName:row.referenceName||row.referenceCode||row.referenceNumber||'',referenceCode:row.referenceCode||row.referenceNumber||'',referenceNumber:row.referenceNumber||'',startDate:row.startDate||null,endDate:row.endDate||null,examDate:row.examDate||null,registrationDeadline:row.registrationDeadline||null,mode:row.mode||'',modeLabel:row.modeLabel||'',location:row.location||'',duration:row.duration||course.duration||'',seats:row.seats??null,status:row.status,showInSchedule:true,price,coursePrice:price,currency:row.currency||course.currency||'',currencySymbol:row.currencySymbol||course.currencySymbol||''};
 result.registrationAvailable=isRegistrationOpen(result,now);
 result.registrationUrl=registrationHref(course,result,now);
 return plain(result);
}
/** Read both storage models; only verified, published course relations can produce a session. */
export async function readPublicSessions({id,courseId,from,to,overlap=false,mode='',limit=0}={}) {
 await connectDB();
 const query={...SCHEDULED_SESSION};
 if(id) {if(!mongoose.isValidObjectId(id)) return []; query._id=id;}
 if(mode) query.mode=mode;
 if(from||to) {
  const range={...(from?{$gte:from}:{}),...(to?{$lt:to}:{})};
  if(overlap && from && to) query.$or=[{startDate:range},{endDate:range},{startDate:{$lt:from},endDate:{$gte:to}}];
  else query.startDate=range;
 }
 const sources=[[CourseReferenceSession,TrainingCourse,'CourseReferenceSession'],[CourseReference,DefaultCourse,'CourseReference']];
 const groups=await Promise.all(sources.map(async([Session,Course,sourceType])=>{
  const rows=await Session.find(query).sort({startDate:1}).lean();
  const ids=[...new Set(rows.map(row=>String(row.course?._id||row.course||(sourceType==='CourseReference'?row.courseId:'')||'')).filter(id=>mongoose.isValidObjectId(id)))];
  if(!ids.length) return [];
  const courses=await Course.find({_id:{$in:ids},...PUBLISHED}).populate({path:'level',select:'name slug color',match:PUBLISHED}).populate({path:'awardingBody',select:'name slug logo',match:PUBLISHED}).lean();
  const byId=new Map(courses.map(course=>[String(course._id),course]));
  return rows.map(row=>{const linked=String(row.course?._id||row.course||(sourceType==='CourseReference'?row.courseId:'')||''); return normalizePublicSession(row,byId.get(linked),sourceType);}).filter(Boolean);
 }));
 const flat=groups.flat().filter(row=>!courseId||row.courseId===String(courseId)).sort((a,b)=>new Date(a.startDate||0)-new Date(b.startDate||0)||a.id.localeCompare(b.id));
 const seenKeys=new Set();
 const rows=[];
 for(const r of flat) {
  const key=r.id || (r.referenceCode ? `${r.courseId}_${r.referenceCode}` : `${r.courseId}_${r.startDate}`);
  if(!seenKeys.has(key)) { seenKeys.add(key); rows.push(r); }
 }
 return limit?rows.slice(0,limit):rows;
}

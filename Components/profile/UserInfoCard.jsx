export default function UserInfoCard({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm md:text-base">Email:</span>
          <span className="font-medium text-sm md:text-base truncate ml-2">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm md:text-base">Role:</span>
          <span className="font-medium capitalize text-sm md:text-base">{user?.role}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm md:text-base">Account Status:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
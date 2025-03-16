const TYPES = {
  IUserRepository: Symbol.for("IUserRepository"),
  IAuthService: Symbol.for("IAuthService"),
  IAdminService: Symbol.for("IAdminService"),
  ICourseService: Symbol.for("ICourseService"),
  IAuthController: Symbol.for("IAuthController"),
  IAdminController: Symbol.for("IAdminController"),
  ICourseController: Symbol.for("ICourseController"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  IMailService: Symbol.for("IMailService"),
  IJwtService: Symbol.for("IJwtService"),
  IRedisClient: Symbol.for("IRedisClient"),
  CourseModel: Symbol.for("CourseModel"),
  UserModel: Symbol.for("UserModel"),
  UserCourseProgressModel: Symbol.for("UserCourseProgressModel"),
  IUserCourseProgressRepository: Symbol.for("IUserCourseProgressRepository"),
  IUserCourseProgressService: Symbol.for("IUserCourseProgressService"),
  IUserCourseProgressController: Symbol.for("IUserCourseProgressController"),
};

export default TYPES;

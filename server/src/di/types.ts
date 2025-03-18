const TYPES = {
  //Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  IUserCourseProgressRepository: Symbol.for("IUserCourseProgressRepository"),
  ITransactionRepository: Symbol.for("ITransactionRepository"),

  //Services
  IAuthService: Symbol.for("IAuthService"),
  IAdminService: Symbol.for("IAdminService"),
  ICourseService: Symbol.for("ICourseService"),
  IUserCourseProgressService: Symbol.for("IUserCourseProgressService"),
  ITransactionService: Symbol.for("ITransactionService"),
  IUserService: Symbol.for("IUserService"),

  //Controllers
  IAuthController: Symbol.for("IAuthController"),
  IAdminController: Symbol.for("IAdminController"),
  ICourseController: Symbol.for("ICourseController"),
  IUserCourseProgressController: Symbol.for("IUserCourseProgressController"),
  ITransactionController: Symbol.for("ITransactionController"),
  IUserController: Symbol.for("IUserController"),

  //Utils
  IMailService: Symbol.for("IMailService"),
  IJwtService: Symbol.for("IJwtService"),
  IRedisClient: Symbol.for("IRedisClient"),

  //Models
  CourseModel: Symbol.for("CourseModel"),
  UserModel: Symbol.for("UserModel"),
  UserCourseProgressModel: Symbol.for("UserCourseProgressModel"),
  TransactionModel: Symbol.for("TransactionModel"),

};

export default TYPES;

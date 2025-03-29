const TYPES = {
  //Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  IUserCourseProgressRepository: Symbol.for("IUserCourseProgressRepository"),
  ITransactionRepository: Symbol.for("ITransactionRepository"),
  IChatRepository: Symbol.for("IChatRepository"),
  ILiveClassRepository: Symbol.for("ILiveClassRepository"),

  //Services
  IAuthService: Symbol.for("IAuthService"),
  IAdminService: Symbol.for("IAdminService"),
  ICourseService: Symbol.for("ICourseService"),
  IUserCourseProgressService: Symbol.for("IUserCourseProgressService"),
  ITransactionService: Symbol.for("ITransactionService"),
  IUserService: Symbol.for("IUserService"),
  IDashboardService: Symbol.for("IDashboardService"),
  IChatService: Symbol.for("IChatService"),
  ILiveClassService: Symbol.for("ILiveClassService"),

  //Controllers
  IAuthController: Symbol.for("IAuthController"),
  IAdminController: Symbol.for("IAdminController"),
  ICourseController: Symbol.for("ICourseController"),
  IUserCourseProgressController: Symbol.for("IUserCourseProgressController"),
  ITransactionController: Symbol.for("ITransactionController"),
  IUserController: Symbol.for("IUserController"),
  IDashboardController: Symbol.for("IDashboardController"),
  IChatController: Symbol.for("IChatController"),
  ILiveClassController: Symbol.for("ILiveClassController"),

  //Utils
  IMailService: Symbol.for("IMailService"),
  IJwtService: Symbol.for("IJwtService"),
  IRedisClient: Symbol.for("IRedisClient"),

  //Models
  CourseModel: Symbol.for("CourseModel"),
  UserModel: Symbol.for("UserModel"),
  UserCourseProgressModel: Symbol.for("UserCourseProgressModel"),
  TransactionModel: Symbol.for("TransactionModel"),
  MessageModel: Symbol.for("MessageModel"),
  LiveClassModel: Symbol.for("LiveClassModel"),
};

export default TYPES;

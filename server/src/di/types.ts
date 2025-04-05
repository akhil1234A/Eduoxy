const TYPES = {
  //Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  IUserCourseProgressRepository: Symbol.for("IUserCourseProgressRepository"),
  ITransactionRepository: Symbol.for("ITransactionRepository"),
  IChatRepository: Symbol.for("IChatRepository"),
  ILiveClassRepository: Symbol.for("ILiveClassRepository"),
  IForumRepository: Symbol.for("IForumRepository"),
  ICodeRunnerRepository: Symbol.for("ICodeRunnerRepository"),

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
  IForumService: Symbol.for("IForumService"),
  ICodeRunnerService: Symbol.for("ICodeRunnerService"),

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
  ICodeRunnerController: Symbol.for("ICodeRunnerController"),

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
  ProblemModel: Symbol.for("ProblemModel"),
};

export default TYPES;

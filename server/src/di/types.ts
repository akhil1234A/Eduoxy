

const TYPES = {
  //Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  IUserCourseProgressRepository: Symbol.for("IUserCourseProgressRepository"),
  ITransactionRepository: Symbol.for("ITransactionRepository"),
  IChatRepository: Symbol.for("IChatRepository"),
  ILiveClassRepository: Symbol.for("ILiveClassRepository"),
  IForumRepository: Symbol.for("IForumRepository"),
  IRoadmapRepository: Symbol.for("IRoadmapRepository"),
  IReviewRepository: Symbol.for("IReviewRepository"),
  ICertificateRepository: Symbol.for("ICertificateRepository"),
  TimeTrackingRepository: Symbol.for("TimeTrackingRepository"),


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
  IRoadmapService: Symbol.for("IRoadmapService"),
  IReviewService: Symbol.for("IReviewService"),
  IEmailTemplateService: Symbol.for("IEmailTemplateService"),
  ICertificateService: Symbol.for("ICertificateService"),
  ITimeTrackingService: Symbol.for("ITimeTrackingService"),

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
  IRoadmapController: Symbol.for("IRoadmapController"),
  ReviewController: Symbol.for("ReviewController"),
  IForumController: Symbol.for("IForumController"),
  ICertificateController: Symbol.for("ICertificateController"),
  ITimeTrackingController: Symbol.for("ITimeTrackingController"),

  //Utils
  IMailService: Symbol.for("IMailService"),
  IJwtService: Symbol.for("IJwtService"),
  IRedisClient: Symbol.for("IRedisClient"),
  MapperUtil: Symbol.for("MapperUtil"),

  //Models
  CourseModel: Symbol.for("CourseModel"),
  UserModel: Symbol.for("UserModel"),
  UserCourseProgressModel: Symbol.for("UserCourseProgressModel"),
  TransactionModel: Symbol.for("TransactionModel"),
  MessageModel: Symbol.for("MessageModel"),
  LiveClassModel: Symbol.for("LiveClassModel"),
  RoadmapModel: Symbol.for("RoadmapModel"),
  ReviewModel: Symbol.for("ReviewModel"),
  CertificateModel: Symbol.for("CertificateModel"),
  ReviewService: Symbol.for("ReviewService"),
  UserTimeTrackingModel: Symbol.for("UserTimeTrackingModel"),
};

export default TYPES;

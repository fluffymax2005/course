dotnet ef database drop --force -c OrderDbContext
dotnet ef database drop --force -c CredentialDbContext

dotnet ef migrations add InitMigration -c OrderDbContext 
dotnet ef migrations add InitMigration -c CredentialDbContext

dotnet ef database update -c OrderDbContext
dotnet ef database update -c CredentialDbContext
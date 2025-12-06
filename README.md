<!DOCTYPE html>
<html>
<body>

<strong>NOTE:</strong> all commands are entered in powershell.

<h2>1. Prerequests</h2>

Check .NET version and SDK's. Install SDK and GIT from official resources.

dotnet --version<br>
dotnet --list-sdks

<h2>2. Making project workspace</h2>

Create folder for your project. Go to your project folder.

<h2>3. Creating project</h2>

Create ASP.NET WEB API project<br>
<code>
dotnet new webapi -o DbAPI -f net8.0<br>
cd DbAPI
</code>

<h2>4. Configuring meta data</h2>
Configure "appsettings.json" file. Obligating prerequestes are showed below:

<pre><small>
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },

  "ConnectionStrings": {
    "DefaultDataConnection": "Server=&lt;Your_server_IP_or_name&gt;;Database=&lt;Your_DB_name&gt;;User ID=&lt;Your_DB_login&gt;;Password=&lt;Your_DB_password&gt;;Trusted_Connection=True;TrustServerCertificate=True;", // Main Db
    "DefaultCredentialConnection": "Server=&lt;Your_server_IP_or_name&gt;;Database=&lt;Your_DB_name&gt;;User ID=&lt;Your_DB_login&gt;;Password=&lt;Your_DB_password&gt;;Trusted_Connection=True;TrustServerCertificate=True;", // User data Db
  },

  "IncludeSeedData": &lt;true_or_false&gt;, // whether use seed data when OrderDbContext migration is initialized

  "AllowedHosts": "*"
}
</small></pre>

<h2>5. Update DbAPI.csproj</h2>

If you are going to use ONLY Docker Desktop add following code:

```xml
<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|AnyCPU'">
  <DefineConstants>$(DefineConstants);DOCKER</DefineConstants>
</PropertyGroup>
<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|AnyCPU'">
  <DefineConstants>$(DefineConstants);DOCKER</DefineConstants>
</PropertyGroup>
```
If you are going to use ONLY Swagger add following code:

```xml
<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|AnyCPU'">
  <DefineConstants>$(DefineConstants);SWAGGER</DefineConstants>
</PropertyGroup>
<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|AnyCPU'">
  <DefineConstants>$(DefineConstants);SWAGGER</DefineConstants>
</PropertyGroup>
```

Note: using both constants may cause compile/logic errors

<h2>6. Secrets files</h2>

Create directory "Secrets" for secrets in "Infrastructure" directory. Append "EmailSettings.json" and "JwtSettings.json" there.

<h3>Configure "EmailSettings.json"</h3>

<pre><small>
{
  "Email": {
    "Host": "&lt;Your_email_host&gt;",
    "Port": &lt;Your_port&gt;,
    "Username": "&lt;Your_email_address&gt;",
    "Password": "&lt;Your_external_apps_email_password&gt;",
    "From": "&lt;Your_email_address&gt;",
    "DisplayName": "&lt;Email_title&gt;"
  }
}
</small></pre>

<h3>Configure "JwtSettings.json"</h3>

<pre><small>
{
  "JwtSettings": {
    "SecretKey": "&lt;Your_secret_key&gt;",
    "Issuer": "&lt;Your_issuer&gt;",
    "Audience": "&lt;Your_audience&gt;",
    "ExpiryInMinutes": &lt;Token_expiry_time_in_minutes&gt;
  }
}
</small></pre>


<h2>7. Required packages.</h2>

Install packages:

<code>
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0<br>
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.20
</code>

<h2>8. Cloning repository</h2>

Clone repository in any place where "course" directory does not exist (or it is empty)<br><br>
<code>
git clone https://github.com/petrosyan20051/course.git<br>
cd course
git switch DBAPI
</code>

<h1>9. Cut and paste all files from repos to &lt;your_project_folder_name&gt; folder. Accept rewriting case neccessary.</h1>

</body>
</html>
<!DOCTYPE html>
<html>
<body>

<div class="note">
    <strong>NOTE:</strong> all commands are entered in powershell.
</div>

<h1>1. Check .NET version and SDK's. Install SDK and GIT from official resources.</h1>

<div class="command-section">
dotnet --version<br>
dotnet --list-sdks
</div>

<h1>2. Create folder for your project. Go to your project folder.</h1>

<h1>3. Create ASP.NET WEB API project</h1>

<div class="command-section">
dotnet new webapi -o DbAPI -f net8.0<br>
cd DbAPI
</div>

<h1>4. Install required packages.</h1>

<div class="command-section">
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0<br>
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0<br>
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.20
</div>

<h1>5. Clone repository in any place where "course" directory does not exist (or it is empty)</h1>

<div class="command-section">
git clone https://github.com/petrosyan20051/course.git<br>
cd course
</div>

<h1>6. Switch DBAPI branch</h1>

<div class="command-section">
git switch DBAPI
</div>

<h1>7. Cut and paste all files (except ".git" folder) from repos to &lt;your_project_folder_name&gt; folder. Accept rewriting case neccessary.</h1>

<h1>8. Enjoy development.</h1>

</body>
</html>
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props BookReview.slnx ./
COPY src/BookReview.Domain/BookReview.Domain.csproj src/BookReview.Domain/
COPY src/BookReview.Application/BookReview.Application.csproj src/BookReview.Application/
COPY src/BookReview.Infrastructure/BookReview.Infrastructure.csproj src/BookReview.Infrastructure/
COPY src/BookReview.Presentation/BookReview.Presentation.csproj src/BookReview.Presentation/
COPY tests/BookReview.Domain.Tests/BookReview.Domain.Tests.csproj tests/BookReview.Domain.Tests/
COPY tests/BookReview.Application.Tests/BookReview.Application.Tests.csproj tests/BookReview.Application.Tests/
COPY tests/BookReview.Infrastructure.Tests/BookReview.Infrastructure.Tests.csproj tests/BookReview.Infrastructure.Tests/
RUN dotnet restore

COPY . .
RUN dotnet publish src/BookReview.Presentation/BookReview.Presentation.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "BookReview.Presentation.dll"]

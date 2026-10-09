FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["logistica-service.csproj", "./"]
RUN dotnet restore "logistica-service.csproj" --no-cache
COPY . .
RUN dotnet publish "logistica-service.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8085
ENTRYPOINT ["dotnet", "logistica-service.dll"]

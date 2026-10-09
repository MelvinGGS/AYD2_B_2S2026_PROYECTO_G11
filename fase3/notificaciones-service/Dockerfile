FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["notificaciones-service.csproj", "./"]
RUN dotnet restore "notificaciones-service.csproj"
COPY . .
RUN dotnet publish "notificaciones-service.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8086
ENTRYPOINT ["dotnet", "notificaciones-service.dll"]

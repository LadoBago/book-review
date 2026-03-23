using BookReview.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BookReview.Infrastructure.Tests;

public static class TestDbContextFactory
{
    public static (SqliteTestDbContext Context, SqliteConnection Connection) Create()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new SqliteTestDbContext(options);
        context.Database.EnsureCreated();

        return (context, connection);
    }
}

/// <summary>
/// Test DbContext that adds DateTimeOffset conversions required by SQLite.
/// </summary>
public class SqliteTestDbContext : AppDbContext
{
    public SqliteTestDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTimeOffset>()
            .HaveConversion<long>();
    }
}

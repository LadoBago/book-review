using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookReview.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "Quotes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "Quotes");
        }
    }
}

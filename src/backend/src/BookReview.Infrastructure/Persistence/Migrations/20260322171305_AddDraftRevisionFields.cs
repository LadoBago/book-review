using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookReview.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDraftRevisionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DraftBody",
                table: "Reviews",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DraftQuotes",
                table: "Reviews",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DraftTitle",
                table: "Reviews",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DraftBody",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "DraftQuotes",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "DraftTitle",
                table: "Reviews");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STAJ1.Migrations
{
    /// <inheritdoc />
    public partial class SonOkuma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "sonokumatarihi",
                table: "sohbetkatilimcilari",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "sonokumatarihi",
                table: "sohbetkatilimcilari");
        }
    }
}

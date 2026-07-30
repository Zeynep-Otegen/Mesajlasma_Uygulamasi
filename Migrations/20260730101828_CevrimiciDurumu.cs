using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace STAJ1.Migrations
{
    /// <inheritdoc />
    public partial class CevrimiciDurumu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
        name: "CevrimiciMi",
        table: "kullanicilar",
        type: "boolean",
        nullable: false,
        defaultValue: false);

    migrationBuilder.AddColumn<DateTime>(
        name: "SonGorulme",
        table: "kullanicilar",
        type: "timestamp with time zone",
        nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
        name: "CevrimiciMi",
        table: "kullanicilar");

    migrationBuilder.DropColumn(
        name: "SonGorulme",
        table: "kullanicilar");
        }
    }
}

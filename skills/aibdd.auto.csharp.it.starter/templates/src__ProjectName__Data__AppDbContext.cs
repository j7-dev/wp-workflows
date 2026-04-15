using Microsoft.EntityFrameworkCore;

namespace ${ProjectName}.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet properties 由 schema-analysis 階段新增，例如：
    // public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Entity configurations 由 schema-analysis 階段新增，例如：
        // modelBuilder.Entity<LessonProgress>(entity =>
        // {
        //     entity.ToTable("lesson_progresses");
        //     entity.HasKey(e => new { e.UserId, e.LessonId });
        //     entity.Property(e => e.Status).HasConversion<string>();
        // });
    }
}

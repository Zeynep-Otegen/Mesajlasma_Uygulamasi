using STAJ1.Data;
using Microsoft.EntityFrameworkCore;

using System.Linq.Expressions;
namespace STAJ1.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    private readonly UygulamaDbContext _context;
    private readonly DbSet<T> _dbSet;

    // YENİ EKLENEN: Dependency Injection (Bağımlılık Enjeksiyonu) Kapısı
    // Program.cs, UygulamaDbContext'i hazırlayıp buraya otomatik gönderecek.
    public GenericRepository(UygulamaDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }
    public List<T> HepsiniGetir()
    {
        return _dbSet.ToList(); // T neyse (örneğin Rol), o tabloyu listeler
    }

    public T? IdyeGoreGetir(int id)
    {
        return _dbSet.Find(id);
    }

    public void Ekle(T entity)
    {
        _dbSet.Add(entity);
        _context.SaveChanges();
    }

    public void Guncelle(T entity)
    {
        _dbSet.Update(entity);
        _context.SaveChanges();
    }

    public void Sil(int id)
    {
        var entity = _dbSet.Find(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            _context.SaveChanges();
        }
    }
    public T? SartaGoreGetir(Expression<Func<T, bool>> filtre)
    {
        return _dbSet.FirstOrDefault(filtre);
    }
}
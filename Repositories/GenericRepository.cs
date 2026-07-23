using STAJ1.Data;
using Microsoft.EntityFrameworkCore;

using System.Linq.Expressions;
namespace STAJ1.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    public List<T> HepsiniGetir()
    {
        using var db = new UygulamaDbContext();
        return db.Set<T>().ToList(); // T neyse (örneğin Rol), o tabloyu listeler
    }

    public T? IdyeGoreGetir(int id)
    {
        using var db = new UygulamaDbContext();
        return db.Set<T>().Find(id);
    }

    public void Ekle(T entity)
    {
        using var db = new UygulamaDbContext();
        db.Set<T>().Add(entity);
        db.SaveChanges();
    }

    public void Guncelle(T entity)
    {
        using var db = new UygulamaDbContext();
        db.Set<T>().Update(entity);
        db.SaveChanges();
    }

    public void Sil(int id)
    {
        using var db = new UygulamaDbContext();
        var entity = db.Set<T>().Find(id);
        if (entity != null)
        {
            db.Set<T>().Remove(entity);
            db.SaveChanges();
        }
    }
    public T? SartaGoreGetir(Expression<Func<T, bool>> filtre)
    {
        using var db = new UygulamaDbContext();
        return db.Set<T>().FirstOrDefault(filtre);
    }
}
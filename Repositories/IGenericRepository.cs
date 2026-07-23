using System.Linq.Expressions;
namespace STAJ1.Repositories;

// "where T : class" ifadesi, T'nin sadece bir Model sınıfı (Kullanici, Rol vb.) olabileceğini garantiler.
public interface IGenericRepository<T> where T : class
{
    List<T> HepsiniGetir();
    T? IdyeGoreGetir(int id);
    T? SartaGoreGetir(Expression<Func<T, bool>> filtre);
    void Ekle(T entity);
    void Guncelle(T entity);
    void Sil(int id);
}
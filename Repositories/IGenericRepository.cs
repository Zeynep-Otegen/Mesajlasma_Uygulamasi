using System.Linq.Expressions;
namespace STAJ1.Repositories;

// "where T : class" ifadesi, T'nin sadece bir Model sınıfı (Kullanici, Rol vb.) olabileceğini garantiler.
public interface IGenericRepository<T> where T : class
{
    List<T> GetAll();
    T? GetById(int id);
    T? Get(Expression<Func<T, bool>> filtre);
    void Add(T entity);
    void Update(T entity);
    void Delete(int id);
}
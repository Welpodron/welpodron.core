<?
namespace Welpodron\Core\View;

interface Renderable
{
    public function render(string $path, array $args = []): string;
}
